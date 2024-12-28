import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateMovieDto, UpdateMovieDto } from './dto';
import { Movie } from '@prisma/client';
import { Request, Response } from 'express';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { promisify } from 'util';
import FFprobeMetadata from './movie-interace';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly REDIS: RedisService,
  ) {}

  private async determineMetadata(
    file: Express.Multer.File,
  ): Promise<{ duration: number; resolution: string[] }> {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const tempFilePath = path.join(
      uploadsDir,
      `${Date.now()}-${file.originalname}`,
    );
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      const ffprobePromise = promisify(ffmpeg.ffprobe);
      const metadata = (await ffprobePromise(tempFilePath)) as FFprobeMetadata;
      const videoStream = metadata.streams.find(
        (stream) => stream.width && stream.height,
      );
      if (!videoStream) {
        throw new BadRequestException('No video stream found');
      }
      const duration = metadata.format?.duration || 0;
      const { width, height } = videoStream;

      const sizeInMB = file.size / (1024 * 1024); // Convert to MB
      const durationInMinutes = duration / 60; // Convert to minutes

      let resolution: string[];

      switch (true) {
        case sizeInMB > 1000 || durationInMinutes > 120 || width >= 3840:
          resolution = ['4K', '1080p', '720p'];
          break;
        case sizeInMB > 500 || durationInMinutes > 60 || width >= 1920:
          resolution = ['1080p', '720p'];
          break;
        case sizeInMB > 100 || durationInMinutes > 30 || width >= 1280:
          resolution = ['720p', '480p'];
          break;
        default:
          resolution = ['480p'];
      }

      return { duration, resolution };
    } finally {
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
    }
  }

  private async validateFiles(
    poster?: Express.Multer.File,
    video?: Express.Multer.File,
  ): Promise<{
    posterFile: Express.Multer.File;
    videoFile: Express.Multer.File;
  }> {
    if (!poster) {
      throw new BadRequestException('Poster file is missing');
    }

    if (!video) {
      throw new BadRequestException('Video file is missing');
    }

    // Define allowed mime types
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/x-png',
    ];
    const allowedVideoTypes = ['video/mp4', 'video/mkv'];

    // Validate poster mime type
    if (!allowedImageTypes.includes(poster.mimetype)) {
      throw new BadRequestException('Invalid poster file type');
    }

    // Validate video mime type
    if (!allowedVideoTypes.includes(video.mimetype)) {
      throw new BadRequestException('Invalid video file type');
    }

    // Return validated files
    return { posterFile: poster, videoFile: video };
  }

  // Create a new movie
  async create(
    dto: CreateMovieDto,
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ): Promise<Movie> {
    const { title, description, genre } = dto;

    if (!files || !files.poster || !files.video) {
      throw new BadRequestException('Poster and video files are required');
    }

    // Check if movie already exists
    const existingMovie = await this.prisma.movie.findFirst({
      where: { title },
    });

    if (existingMovie) {
      throw new ConflictException('Movie already exists');
    }

    const { poster, video } = files;
    const { posterFile, videoFile } = await this.validateFiles(poster, video); // Validate files
    const { resolution, duration } = await this.determineMetadata(videoFile); // Determine resolution based on video file metadata

    // Upload files to Cloudinary
    const posterUpload = await this.cloudinary.upload(posterFile, 'posters');
    const videoUpload = await this.cloudinary.upload(videoFile, 'videos');

    const createMovie = await this.prisma.movie.create({
      data: {
        title,
        description,
        genre,
        duration,
        poster: posterUpload.secure_url,
        video: videoUpload.secure_url,
        resolution,
      },
    });

    // Invalidate Redis cache for movie list
    await this.REDIS.del('movies:all');

    return createMovie;
  }

  async streamMovie(title: string, req: Request, res: Response) {
    // Fetch movie details
    const movie = await this.findOneByName(title);
    if (!movie || !movie.video) {
      throw new HttpException('Movie not found', HttpStatus.NOT_FOUND);
    }

    const range = req.headers.range;
    // Validate the video URL before streaming
    try {
      new URL(movie.video); // Throws an error if the URL is invalid
    } catch (error) {
      console.error('Invalid video URL:', error);
      throw new BadRequestException('Invalid video URL');
    }

    // Use the Cloudinary streaming method
    await this.cloudinary.streamMovie(movie.video, res, range);
  }

  // Find all movies
  async findAll() {
    const key = 'movies:all';

    // Check Redis cache for movies
    const cachedMovies = await this.REDIS.get<Movie[]>(key);
    if (cachedMovies) {
      return cachedMovies;
    }

    const movies = await this.prisma.movie.findMany({
      include: { showtimes: true },
    });

    // Cache the movies in Redis
    await this.REDIS.set(key, movies, 3600); // Cache for 1 hour

    return movies;
  }

  // Find a movie by Title
  async findOneByName(title: string): Promise<Movie | null> {
    const key = `movie:${title}`;

    // Check Redis cache for the movie
    const cachedMovie = await this.REDIS.get<Movie>(key);
    if (cachedMovie) {
      return cachedMovie;
    }

    const movie = await this.prisma.movie.findFirst({
      where: { title },
      include: { showtimes: true },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with Title "${title}" not found`);
    }

    // Cache the movie in Redis
    await this.REDIS.set(key, movie, 3600); // Cache for 1 hour

    return movie;
  }

  // Update a movie by Title
  async update(
    title: string,
    updateDto: UpdateMovieDto,
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    // Fetch the movie by title
    const movie = await this.findOneByName(title);

    // Validate and upload new poster
    const { poster, video } = files;
    // Validate files
    const { posterFile, videoFile } = await this.validateFiles(poster, video);

    // Initialize the `updates` object for Cloudinary and Prisma
    const cloudinaryUpdates = await this.cloudinary.update(
      { poster: movie.poster, video: movie.video },
      { poster: posterFile, video: videoFile },
    );

    const updates: Partial<
      UpdateMovieDto & {
        resolution: string[];
        duration: number;
        poster: string;
        video: string;
      }
    > = {
      ...updateDto,
      poster: cloudinaryUpdates.poster,
      video: cloudinaryUpdates.video,
    };

    // If a new video was uploaded, determine its resolution
    if (videoFile) {
      const { resolution, duration } = await this.determineMetadata(videoFile);
      updates.resolution = resolution;
      updates.duration = duration;
    }

    // Update the movie in the database
    const updatedMovie = await this.prisma.movie.update({
      where: { id: movie.id },
      data: updates,
    });

    // Invalidate Redis cache for this movie and movie list
    await this.REDIS.del(`movie:${title}`);
    await this.REDIS.del('movies:all');

    return updatedMovie;
  }

  // Delete a movie by Title
  async remove(title: string) {
    const movie = await this.findOneByName(title);

    const delMovie = await this.prisma.movie.delete({
      where: { id: movie.id },
    });

    // Invalidate Redis cache for this movie and movie list
    await this.REDIS.del(`movie:${title}`);
    await this.REDIS.del('movies:all');

    return delMovie;
  }
}
