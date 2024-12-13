import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, UpdateMovieDto } from './dto';
import { CloudinaryService } from './cloudinary.service';
import { Movie } from '@prisma/client';

@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  private async uploadFileToCloudinary(
    file: Express.Multer.File,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cloudinary.storage._handleFile(null, file, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Helper function to determine video resolution based on file size
  private determineResolution(fileSize: number): string[] {
    // File size in bytes
    const sizeInMB = fileSize / (1024 * 1024); // Convert to MB

    if (sizeInMB > 1000) return ['4K', '1080p', '720p'];
    if (sizeInMB > 500) return ['1080p', '720p'];
    if (sizeInMB > 100) return ['720p', '480p'];
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
      // Validate files
      const { posterFile, videoFile } = this.validateFiles(files);

      // Determine resolution based on video file size
      const resolution = this.determineResolution(videoFile.size);

      // Upload files to Cloudinary
      const posterUpload = await this.uploadFileToCloudinary(posterFile);
      const videoUpload = await this.uploadFileToCloudinary(videoFile);

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

  // Find all movies
  async findAll() {
    return await this.prisma.movie.findMany();
  }

  // Find a movie by Title
  async findOneByName(title: string) {
    const movie = await this.prisma.movie.findFirst({
      where: { title },
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
    const movie = await this.prisma.movie.findFirst({
      where: { title },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }

    try {
      // Validate files
      const { posterFile, videoFile } = this.validateFiles(files);

      // Determine resolution based on video file size
      const resolution = this.determineResolution(videoFile.size);

      // Upload files to Cloudinary
      const posterUpload = await this.uploadFileToCloudinary(posterFile);
      const videoUpload = await this.uploadFileToCloudinary(videoFile);

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
    const movie = await this.prisma.movie.findFirst({
      where: { title },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }
    return await this.prisma.movie.delete({
      where: { id: movie.id },
    });
  }
}
