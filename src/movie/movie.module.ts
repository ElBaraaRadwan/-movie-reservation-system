import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      storage: Storage,
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService, PrismaService],
})
export class MovieModule {}
