import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto';
import { UpdateShowtimeDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/modules/movie/movie.service';
import { Showtime } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ShowtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private movieService: MovieService,
    private readonly REDIS: RedisService,
  ) {}
  async create(createDto: CreateShowtimeDto, title: string) {
    const movie = await this.movieService.findOneByName(title);

    const showTime = await this.prisma.showtime.create({
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

    // Invalidate related cache
    await this.REDIS.del(`showtime:all`);

    return showTime;
  }

  async findOne(title: string): Promise<Showtime> {
    const cacheKey = `showtime:${title}`;
    const cachedData = await this.REDIS.get<string>(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const movie = await this.movieService.findOneByName(title);

    const showTimes = await this.prisma.showtime.findFirst({
      where: {
        movieId: movie.id,
      },
      include: {
        movie: true,
      },
    });

    if (!showTimes)
      throw new NotFoundException(
        `Showtime not found for movie with title ${title}`,
      );

    // Cache the result
    await this.REDIS.set(cacheKey, showTimes, 60 * 5); // Cache for 5 minutes

    return showTimes;
  }

  async findAll() {
    const cacheKey = `showtime:all`;
    const cachedData = await this.REDIS.get<string>(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const showtimes = await this.prisma.showtime.findMany({
      include: {
        movie: true,
      },
    });

    // Cache the result
    await this.REDIS.set(cacheKey, JSON.stringify(showtimes), 60 * 5); // Cache for 5 minutes

    return showtimes;
  }

  async update(title: string, updateDto: UpdateShowtimeDto) {
    const movie = await this.movieService.findOneByName(title);

    const showTime = await this.prisma.showtime.findFirst({
      where: {
        movieId: movie.id,
      },
    });

    if (!showTime)
      throw new NotFoundException(
        `Showtime not found for movie with title ${title}`,
      );

    const updatedShowtime = await this.prisma.showtime.update({
      where: {
        id: showTime.id,
      },
      data: updateDto,
    });

    // Invalidate related cache
    await this.REDIS.del(`showtime:${title}`);
    await this.REDIS.del(`showtime:all`);

    return updatedShowtime;
  }

  async remove(title: string) {
    const showtime = await this.findOne(title);

    const deletedShowtime = await this.prisma.showtime.delete({
      where: {
        id: showtime.id,
      },
    });

    // Invalidate related cache
    await this.REDIS.del(`showtime:${title}`);
    await this.REDIS.del(`showtime:all`);

    return deletedShowtime;
  }
}
