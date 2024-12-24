import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto';
import { UpdateShowtimeDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/modules/movie/movie.service';
import { Cache } from '@nestjs/cache-manager';
import { Showtime } from '@prisma/client';

@Injectable()
export class ShowtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private movieService: MovieService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}
  async create(createDto: CreateShowtimeDto, title: string) {
    const movie = await this.movieService.findOneByName(title);

    if (!movie)
      throw new NotFoundException(`Movie with title ${title} not found`);

    createDto.movieId = movie.id; // Add movieId to createDto

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

    // Invalidate all showtimes cache
    await this.cacheManager.del('showtimes:all');

    return showTime;
  }

  async findOne(title: string): Promise<Showtime> {
    const cachedShowtime = await this.cacheManager.get<Partial<Showtime>>(
      `showtime:${title}`,
    );

    if (cachedShowtime) {
      // Ensure the cached object matches the Showtime type
      return cachedShowtime as Showtime;
    }

    const movie = await this.movieService.findOneByName(title);

    if (!movie) throw new NotFoundException(`Movie: ${title} not found`);

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

    // Cache the showtime
    await this.cacheManager.set(`showtime:${title}`, showTimes, 3600); // Cache for 1 hour

    return showTimes;
  }

  async findAll() {
    const cachedShowtimes = await this.cacheManager.get('showtimes:all');
    if (cachedShowtimes) {
      return cachedShowtimes;
    }

    const showtimes = await this.prisma.showtime.findMany({
      include: {
        movie: true,
      },
    });

    // Cache all showtimes
    await this.cacheManager.set('showtimes:all', showtimes, 3600); // Cache for 1 hour

    return showtimes;
  }

  async update(title: string, updateDto: UpdateShowtimeDto) {
    const movie = await this.movieService.findOneByName(title);

    if (!movie)
      throw new NotFoundException(`Movie with title ${title} not found`);

    const startTime = updateDto.startTime;
    const showtime = await this.prisma.showtime.findFirst({
      where: {
        movieId: movie.id,
        startTime: startTime,
      },
    });

    if (!showtime) {
      throw new NotFoundException(
        `Showtime with start time ${startTime} not found for movie with title ${title}`,
      );
    }

    updateDto.movieId = movie.id; // Add movieId to updateDto

    const updatedShowtime = await this.prisma.showtime.update({
      where: {
        id: showtime.id,
      },
      data: updateDto,
    });

    // Update the cache
    await this.cacheManager.set(
      `showtime:${title}`,
      updatedShowtime,
      3600, // Cache for 1 hour
    );
    await this.cacheManager.del('showtimes:all'); // Invalidate all showtimes cache

    return updatedShowtime;
  }

  async remove(title: string) {
    const movie = await this.movieService.findOneByName(title);

    if (!movie)
      throw new NotFoundException(`Movie with title ${title} not found`);

    const showtime = await this.prisma.showtime.findFirst({
      where: { movieId: movie.id },
    });

    if (!showtime) {
      throw new NotFoundException(
        `No showtime found for movie with title "${title}".`,
      );
    }

    const deletedShowtime = await this.prisma.showtime.delete({
      where: {
        id: showtime.id,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`showtime:${title}`);
    await this.cacheManager.del('showtimes:all');

    return deletedShowtime;
  }
}
