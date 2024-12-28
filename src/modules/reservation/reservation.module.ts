import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieModule } from 'src/modules/movie/movie.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [ReservationController],
  imports: [MovieModule, RedisModule],
  providers: [ReservationService, PrismaService],
})
export class ReservationModule {}
