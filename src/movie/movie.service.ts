import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, UpdateMovieDto } from './dto';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { Movie } from '@prisma/client';
import { Request, Response } from 'express';
import * as path from 'path';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinary: CloudinaryService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  // Helper function to determine video resolution based on file size
  private determineResolution(fileSize: number, duration: number): string[] {
    // File size in bytes
    const sizeInMB = fileSize / (1024 * 1024); // Convert to MB

    // Duration in seconds
    const durationInMinutes = duration / 60; // Convert to minutes

    if (sizeInMB > 1000 || durationInMinutes > 120)
      return ['4K', '1080p', '720p'];
    if (sizeInMB > 500 || durationInMinutes > 60) return ['1080p', '720p'];
    if (sizeInMB > 100 || durationInMinutes > 30) return ['720p', '480p'];
    return ['480p'];
  }

  private validateFiles(files: {
    poster?: Express.Multer.File;
    video?: Express.Multer.File;
  }) {
    const allowedImageTypes = ['image/jpeg', 'image/png'];
    const allowedVideoTypes = ['video/mp4', 'video/mkv'];

    const posterFile = files.poster?.[0];
    const videoFile = files.video?.[0];

    if (posterFile && !allowedImageTypes.includes(posterFile.mimetype)) {
      throw new BadRequestException('Invalid poster file type');
    }

    if (videoFile && !allowedVideoTypes.includes(videoFile.mimetype)) {
      throw new BadRequestException('Invalid video file type');
    }

    return { posterFile, videoFile };
  }

  // Create a new movie
  async create(
    dto: CreateMovieDto,
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ): Promise<Movie> {
    const { title, description, genre, duration } = dto;

    if (!files || !files.poster || !files.video) {
      throw new BadRequestException('Poster and video files are required');
    }

    try {
      if (await this.findOneByName(title))
        throw new BadRequestException(`Movie: ${title} already exists`);

      // Validate files
      const { posterFile, videoFile } = this.validateFiles(files);

      // Determine resolution based on video file size
      const resolution = this.determineResolution(
        videoFile.size,
        videoFile.duration,
      );

      // Upload files to Cloudinary
      const posterUpload = await this.cloudinary.upload(posterFile);
      const videoUpload = await this.cloudinary.upload(videoFile);

      // Create a new movie
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
    } catch (error) {
      throw new BadRequestException(`Failed to upload files: ${error}`);
    }
  }

  async streamMovie(title: string, req: Request, res: Response) {
    try {
      // Fetch movie details (assuming filePath is stored in DB)
      const movie = await this.findOneByName(title);
      if (!movie || !movie.videoUrl) {
        throw new HttpException('Movie not found', HttpStatus.NOT_FOUND);
      }

      const filePath = path.resolve(movie.videoUrl); // Resolve full path to video file
      const range = req.headers.range;

      await this.cloudinary.streamMovie(filePath, res, range);
    } catch (error) {
      throw new HttpException('Movie not found', HttpStatus.NOT_FOUND);
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
  async findOneByName(title: string) {
    const cacheKey = `movie:${title}`;
    const cachedMovie = await this.cacheManager.get<Movie>(cacheKey);
    if (cachedMovie) {
      return cachedMovie;
    }

    const movie = await this.prisma.movie.findFirst({
      where: { title },
      include: { showtimes: true },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }

    await this.cacheManager.set(cacheKey, movie, 600); // Cache for 10 minutes
    return movie;
  }

  // Update a movie by Title
  async update(
    title: string,
    updateDto: UpdateMovieDto,
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    const movie = await this.findOneByName(title);
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }

    try {
      let updatedPosterUrl = movie.poster;
      let updatedVideoUrl = movie.videoUrl;
      let updatedResolution = movie.resolution;

      // Validate and upload new poster
      if (files.poster) {
        const { posterFile } = this.validateFiles(files);
        const posterUpload = await this.cloudinary.upload(posterFile);
        updatedPosterUrl = posterUpload.secure_url; // New poster URL
      }

      // Validate and upload new video
      if (files.video) {
        const { videoFile } = this.validateFiles(files);
        const videoUpload = await this.cloudinary.upload(videoFile);
        updatedVideoUrl = videoUpload.secure_url; // New video URL
        updatedResolution = this.determineResolution(
          videoFile.size,
          videoFile.duration,
        );
      }

      // Update the movie with the new data
      const updateMovie = await this.prisma.movie.update({
        where: { id: movie.id },
        data: {
          ...updateDto,
          poster: updatedPosterUrl,
          videoUrl: updatedVideoUrl,
          resolution: updatedResolution,
        },
      });

      await this.cacheManager.del(`movie:${title}`); // Invalidate cache for the updated movie
      await this.cacheManager.del('all_movies'); // Invalidate cache for all movies
      return updateMovie;
    } catch (error) {
      throw new BadRequestException(`Failed to upload files: ${error}`);
    }
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
