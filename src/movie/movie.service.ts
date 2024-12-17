import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, UpdateMovieDto } from './dto';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { Movie } from '@prisma/client';
import { Request, Response } from 'express';
import * as path from 'path';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinary: CloudinaryService,
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

    const posterFile = files.poster[0];
    const videoFile = files.video[0];

    if (!allowedImageTypes.includes(posterFile.mimetype)) {
      throw new BadRequestException('Invalid poster file type');
    }

    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
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
      console.log(
        `title: ${title},
        description: ${description},
        genre: ${genre},
        duration: ${duration},
        poster: ${posterUpload.secure_url},
        videoUrl: ${videoUpload.secure_url},
        resolution: ${resolution}`,
      );

      // Create a new movie
      return await this.prisma.movie.create({
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
    return await this.prisma.movie.findMany({ include: { showtimes: true } });
  }

  // Find a movie by Title
  async findOneByName(title: string) {
    const movie = await this.prisma.movie.findFirst({
      where: { title },
      include: { showtimes: true },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }
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

      // Update the movie with the new data
      return await this.prisma.movie.update({
        where: { id: movie.id },
        data: {
          ...updateDto,
          poster: posterUpload ? posterUpload.secure_url : movie.poster,
          videoUrl: videoUpload ? videoUpload.secure_url : movie.videoUrl,
          resolution: resolution || movie.resolution,
        },
      });
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
    return await this.prisma.movie.delete({
      where: { id: movie.id },
    });
  }
}
