import { Module } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { ShowtimeController } from './showtime.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/modules/movie/movie.service';
import { MovieModule } from 'src/modules/movie/movie.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [MovieModule, RedisModule],
  controllers: [ShowtimeController],
  providers: [ShowtimeService, PrismaService, MovieService],
})
export class ShowtimeModule {}
