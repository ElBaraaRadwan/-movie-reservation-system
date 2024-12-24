import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Inject,
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
import { Cache } from '@nestjs/cache-manager';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinary: CloudinaryService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
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
    files: { poster?: Express.Multer.File; videoUrl?: Express.Multer.File },
  ): Promise<Movie> {
    const { title, description, genre } = dto;

    if (!files || !files.poster || !files.videoUrl) {
      throw new BadRequestException('Poster and video files are required');
    }

    // Check if movie already exists
    if (await this.findOneByName(title))
      throw new ConflictException(`Movie: ${title} already exists`);

    const { poster, videoUrl } = files;
    // Validate files
    const { posterFile, videoFile } = await this.validateFiles(
      poster,
      videoUrl,
    );

    // Determine resolution based on video file metadata
    const { resolution, duration } = await this.determineMetadata(videoFile); // Await the resolution determination

    // Upload files to Cloudinary
    const posterUpload = await this.cloudinary.upload(posterFile, 'posters');
    const videoUpload = await this.cloudinary.upload(videoFile, 'videos');

    console.log('Poster upload result:', posterUpload);
    console.log('Video upload result:', videoUpload);

    const createMovie = await this.prisma.movie.create({
      data: {
        title,
        description,
        genre,
        duration,
        poster: posterUpload.secure_url,
        videoUrl: videoUpload.secure_url,
        resolution,
      },
    });

    await this.cacheManager.del('all_movies'); // Invalidate cache for all movies
    return createMovie;
  }

  async streamMovie(title: string, req: Request, res: Response) {
    try {
      // Fetch movie details
      const movie = await this.findOneByName(title);
      if (!movie || !movie.videoUrl) {
        throw new HttpException('Movie not found', HttpStatus.NOT_FOUND);
      }

      const range = req.headers.range;

      // Use the Cloudinary streaming method
      await this.cloudinary.streamMovie(movie.videoUrl, res, range);
    } catch (error) {
      console.error('Error while streaming movie:', error);
      throw new HttpException(
        'Failed to stream movie',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Find all movies
  async findAll() {
    const cacheKey = 'all_movies';
    const cachedMovies = await this.cacheManager.get<Movie[]>(cacheKey);
    if (cachedMovies) {
      return cachedMovies;
    }

    const movies = await this.prisma.movie.findMany({
      include: { showtimes: true },
    });
    await this.cacheManager.set(cacheKey, movies, 600); // Cache for 10 minutes
    return movies;
  }

  // Find a movie by Title
  async findOneByName(title: string): Promise<Movie | null> {
    const cacheKey = `movie:${title}`;
    const cachedMovie = await this.cacheManager.get<Movie>(cacheKey);
    if (cachedMovie) {
      return cachedMovie;
    }

    const movie = await this.prisma.movie.findFirst({
      where: { title },
      include: { showtimes: true },
    });

    if (movie) {
      await this.cacheManager.set(cacheKey, movie, 600); // Cache for 10 minutes
    }

    return movie || null; // Return null if no movie is found
  }

  // Update a movie by Title
  async update(
    title: string,
    updateDto: UpdateMovieDto,
    files: { poster?: Express.Multer.File; videoUrl?: Express.Multer.File },
  ) {
    // Fetch the movie by title
    const movie = await this.findOneByName(title);
    if (!movie) {
      throw new NotFoundException(`Movie with Title "${title}" not found`);
    }

    // Validate and upload new poster
    const { poster, videoUrl } = files;
    // Validate files
    const { posterFile, videoFile } = await this.validateFiles(
      poster,
      videoUrl,
    );

    // Initialize the `updates` object for Cloudinary and Prisma
    const cloudinaryUpdates = await this.cloudinary.update(
      { poster: movie.poster, videoUrl: movie.videoUrl },
      { poster: posterFile, videoUrl: videoFile },
    );

    const updates: Partial<
      UpdateMovieDto & {
        resolution: string[];
        duration: number;
        poster: string;
        videoUrl: string;
      }
    > = {
      ...updateDto,
      poster: cloudinaryUpdates.poster,
      videoUrl: cloudinaryUpdates.videoUrl,
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

    // Invalidate cache for the updated movie and all movies
    await this.cacheManager.del(`movie:${movie.title}`);
    await this.cacheManager.del('all_movies');

    return updatedMovie;
  }

  // Delete a movie by Title
  async remove(title: string) {
    const movie = await this.findOneByName(title);
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }
    const delMovie = await this.prisma.movie.delete({
      where: { id: movie.id },
    });

    await this.cacheManager.del(`movie:${title}`); // Invalidate cache for the deleted movie
    await this.cacheManager.del('all_movies'); // Invalidate cache for all movies
    return delMovie;
  }
}
