import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto, UpdateReservationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private readonly REDIS: RedisService,
  ) {}
  async create(createDto: CreateReservationDto, userId: number) {
    const { movieTitle, seatsReserved } = createDto;

    const showtime = await this.prisma.showtime.findFirst({
      where: { movie: { title: movieTitle } },
    });

    if (showtime.capacity < seatsReserved) {
      return 'Seats are not available';
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        user: {
          connect: { id: userId },
        },
        showtime: {
          connect: { id: showtime.id },
        },
        seatsReserved,
      },
    });

    // Update remaining capacity for the showtime
    await this.prisma.showtime.update({
      where: { id: showtime.id },
      data: { capacity: showtime.capacity - seatsReserved },
    });

    // Invalidate related cache for reservations
    await this.REDIS.del(`reservations:user:${userId}`);
    await this.REDIS.del(`reservations:all`);

    return reservation;
  }

  async findMyReservation(id: number) {
    const cacheKey = `reservations:user:${id}`;
    const cachedData = await this.REDIS.get<string>(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const reservations = await this.prisma.reservation.findMany({
      where: { userId: id },
      include: { showtime: { include: { movie: true } } },
    });

    // Cache the result
    await this.REDIS.set(cacheKey, JSON.stringify(reservations), 60 * 5); // Cache for 5 minutes

    return reservations.length ? reservations : 'No reservations found';
  }

  async findAll() {
    const cacheKey = `reservations:all`;
    const cachedData = await this.REDIS.get<string>(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const reservations = await this.prisma.reservation.findMany({
      include: { showtime: { include: { movie: true } } },
    });

    // Cache the result
    await this.REDIS.set(cacheKey, JSON.stringify(reservations), 60 * 5); // Cache for 5 minutes

    return reservations;
  }

  async update(updateDto: UpdateReservationDto, userId: number) {
    const { seatsReserved, movieTitle } = updateDto;
    const showtime = await this.prisma.showtime.findFirst({
      where: { movie: { title: movieTitle } },
    });

    if (showtime.capacity < seatsReserved) {
      return 'Seats are not available';
    }

    const reservation = await this.prisma.reservation.findMany({
      where: { userId, showtimeId: showtime.id },
    });

    const updatedReservation = await this.prisma.reservation.update({
      where: { id: reservation[0].id, userId },
      data: {
        seatsReserved,
        showtimeId: showtime.id,
      },
    });

    // Update remaining capacity for the showtime
    const seatDifference = seatsReserved - reservation[0].seatsReserved;
    await this.prisma.showtime.update({
      where: { id: showtime.id },
      data: { capacity: showtime.capacity - seatDifference },
    });

    // Invalidate related cache
    await this.REDIS.del(`reservations:user:${userId}`);
    await this.REDIS.del(`reservations:all`);

    return updatedReservation;
  }

  async remove(movieTitle: string, userId: number) {
    const showtime = await this.prisma.showtime.findFirst({
      where: { movie: { title: movieTitle } },
    });

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

    // Invalidate related cache
    await this.REDIS.del(`reservations:user:${userId}`);
    await this.REDIS.del(`reservations:all`);

    return deletedReservation;
  }
}
