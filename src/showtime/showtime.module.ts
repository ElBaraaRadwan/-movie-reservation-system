import { Module } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { ShowtimeController } from './showtime.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovieService } from 'src/movie/movie.service';
import { CloudinaryModule } from 'src/movie/cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/movie/cloudinary/cloudinary.service';

@Module({
  imports: [
    CloudinaryModule,
    MulterModule.registerAsync({
      imports: [CloudinaryModule],
      useFactory: (cloudinaryService: CloudinaryService) => ({
        storage: cloudinaryService.storage,
      }),
      inject: [CloudinaryService],
    }),
  ],
  controllers: [ShowtimeController],
  providers: [ShowtimeService, PrismaService, MovieService],
})
export class ShowtimeModule {}
