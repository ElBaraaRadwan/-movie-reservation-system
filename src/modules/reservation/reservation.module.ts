import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/modules/movie/movie.service';
import { ShowtimeService } from 'src/modules/showtime/showtime.service';
import { MovieModule } from 'src/modules/movie/movie.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [ReservationController],
  imports: [MovieModule, RedisModule],
  providers: [ReservationService, PrismaService, MovieService, ShowtimeService],
})
export class ReservationModule {}
