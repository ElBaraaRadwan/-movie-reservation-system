import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

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
  controllers: [MovieController],
  providers: [MovieService, PrismaService],
})
export class MovieModule {}
