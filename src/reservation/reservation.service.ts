import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto';
import { UpdateReservationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowtimeService } from 'src/showtime/showtime.service';
import { Cache } from '@nestjs/cache-manager';
import { Showtime } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private movieShowtime: ShowtimeService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}
  async create(createDto: CreateReservationDto, userId: number) {
    const { movieTitle, seatsReserved } = createDto;

    const showtime: Showtime = await this.movieShowtime.findOne(movieTitle);

    if (showtime.capacity < seatsReserved) {
      throw new Error('Not enough seats available');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        showtimeId: showtime.id,
        seatsReserved,
      },
    });

    // Cache the reservation
    await this.cacheManager.set(
      `reservation:${reservation.id}`,
      reservation,
      3600, // 1 hour
    );

    return reservation;
  }

  async findMyReservation(id: number) {
    const cachedReservations = await this.cacheManager.get(
      `user-reservations:${id}`,
    );
    if (cachedReservations) {
      return cachedReservations;
    }
    const reservations = await this.prisma.reservation.findMany({
      where: { userId: id },
      include: { showtime: { include: { movie: true } } },
    });

    // Cache the user's reservations
    await this.cacheManager.set(
      `user-reservations:${id}`,
      reservations,
      3600, // 1 hour
    );

    return reservations;
  }

  async findAll() {
    const cachedReservations = await this.cacheManager.get(`all-reservations`);
    if (cachedReservations) {
      return cachedReservations;
    }

    const reservations = await this.prisma.reservation.findMany({
      include: { showtime: { include: { movie: true } } },
    });

    // Cache all reservations
    await this.cacheManager.set(`all-reservations`, reservations, 3600);

    return reservations;
  }

  async update(
    movieTitle: string,
    updateDto: UpdateReservationDto,
    userId: number,
  ) {
    const showtime: Showtime = await this.movieShowtime.findOne(movieTitle);

    const reservation = await this.prisma.reservation.findFirst({
      where: { showtimeId: showtime.id },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found for movie: ${movieTitle}`,
      );
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id: reservation.id, userId },
      data: updateDto,
    });

    // Update the cache
    await this.cacheManager.set(
      `reservation:${reservation.id}`,
      updatedReservation,
      3600,
    );

    return updatedReservation;
  }

  async remove(movieTitle: string, userId: number) {
    const showtime = await this.movieShowtime.findOne(movieTitle);

    const reservation = await this.prisma.reservation.findFirst({
      where: { showtimeId: showtime.id },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found for movie: ${movieTitle}`,
      );
    }

    const deletedReservation = await this.prisma.reservation.delete({
      where: { id: reservation.id, userId },
    });

    // Remove from the cache
    await this.cacheManager.del(`reservation:${reservation.id}`);
    await this.cacheManager.del(`user-reservations:${userId}`);
    await this.cacheManager.del(`all-reservations`);

    return deletedReservation;
  }
}
