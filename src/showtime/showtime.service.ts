import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto';
import { UpdateShowtimeDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/movie/movie.service';

@Injectable()
export class ShowtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private movieService: MovieService,
  ) {}
  async create(createDto: CreateShowtimeDto, title: string) {
    const movie = await this.movieService.findOneByName(title);

    if (!movie) {
      throw new NotFoundException(`Movie with title ${title} not found`);
    }

    createDto.movieId = movie.id; // Add movieId to createDto

    return await this.prisma.showtime.create({
      data: {
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        capacity: createDto.capacity,
        location: createDto.location,
        movie: {
          connect: {
            id: movie.id,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.showtime.findMany({
      include: {
        movie: true,
      },
    });
  }

  async update(title: string, updateDto: UpdateShowtimeDto) {
    const movie = await this.movieService.findOneByName(title);

    const showtime = movie.showtimes.find(
      (st) => st.startTime.getTime() === startTime.getTime(),
    );
    const startTime = movie.showtimes[0].startTime; // Select the first showtime

    if (!showtime) {
      throw new NotFoundException(
        `Showtime with start time ${startTime} not found for movie with title ${title}`,
      );
    }

    updateDto.movieId = movie.id; // Add movieId to updateDto

    return await this.prisma.showtime.update({
      where: {
        movieId_startTime: {
          movieId: movie.id,
          startTime: showtime.startTime,
        },
      },
      data: updateDto,
    });
  }

  async remove(title: string) {
    const movie = await this.movieService.findOneByName(title);

    if (!movie.showtimes || movie.showtimes.length === 0) {
      throw new NotFoundException(
        `No showtimes found for movie with title ${title}`,
      );
    }

    const startTime = movie.showtimes[0].startTime; // Select the first showtime

    return await this.prisma.showtime.delete({
      where: {
        movieId_startTime: {
          movieId: movie.id,
          startTime: startTime,
        },
      },
    });
  }
}
