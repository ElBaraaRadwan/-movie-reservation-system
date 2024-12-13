import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto';
import { UpdateReservationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShowtimeService } from 'src/showtime/showtime.service';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private movieShowtime: ShowtimeService,
  ) {}
  async create(createDto: CreateReservationDto, userId: number) {
    const { movieTitle, seatsReserved } = createDto;

    const showtime = await this.movieShowtime.findOne(movieTitle);

    if (showtime.capacity < seatsReserved) {
      throw new Error('Not enough seats available');
    }

    return await this.prisma.reservation.create({
      data: {
        userId,
        showtimeId: showtime.id,
        seatsReserved,
      },
    });
  }

  async findOne(id: number) {}

  async findAll() {
    return await this.prisma.reservation.findMany({
      include: { showtime: { include: { movie: true } } },
    });
  }

  async update(movieTitle: string, updateDto: UpdateReservationDto) {
    const showtime = await this.movieShowtime.findOne(movieTitle);

    const reservation = await this.prisma.reservation.findFirst({
      where: { showtimeId: showtime.id },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found for movie: ${movieTitle}`,
      );
    }

    return await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: updateDto,
    });
  }

  async remove(movieTitle: string) {
    const showtime = await this.movieShowtime.findOne(movieTitle);

    const reservation = await this.prisma.reservation.findFirst({
      where: { showtimeId: showtime.id },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation not found for movie: ${movieTitle}`,
      );
    }

    return await this.prisma.reservation.delete({
      where: { id: reservation.id },
    });
  }
}
