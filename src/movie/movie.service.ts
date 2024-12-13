import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, UpdateMovieDto } from './dto';

@Injectable()
export class MovieService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new movie
  async create(dto: CreateMovieDto) {
    return await this.prisma.movie.create({
      data: dto,
    });
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
  async update(title: string, updateMovieDto: UpdateMovieDto) {
    const movie = await this.prisma.movie.findFirst({
      where: { title },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with Title ${title} not found`);
    }
    return await this.prisma.movie.update({
      where: { id: movie.id },
      data: updateMovieDto,
    });
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
