import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule, // Explicitly import CloudinaryModule
    MulterModule.registerAsync({
      imports: [CloudinaryModule], // Import CloudinaryModule for Multer
      useFactory: async (cloudinaryService: CloudinaryService) => ({
        storage: cloudinaryService.storage,
      }),
      inject: [CloudinaryService], // Inject CloudinaryService
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService, PrismaService],
})
export class MovieModule {}
