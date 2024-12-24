import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post('/create')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'poster', maxCount: 1 }, // Expecting 1 file for 'poster'
      { name: 'video', maxCount: 1 }, // Expecting 1 file for 'video'
    ]),
  )
  async create(
    @Body() dto: CreateMovieDto,
    @UploadedFiles()
    uploadedFiles: {
      poster?: Express.Multer.File;
      video?: Express.Multer.File;
    },
  ) {
    const files = {
      poster: uploadedFiles.poster ? uploadedFiles.poster[0] : undefined,
      video: uploadedFiles.video ? uploadedFiles.video[0] : undefined,
    };
    return this.movieService.create(dto, files);
  }

  @Get('all')
  findAll() {
    return this.movieService.findAll();
  }

  @Get(':title')
  findOneByName(@Param('title') title: string) {
    return this.movieService.findOneByName(title);
  }

  @Patch(':title')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'poster', maxCount: 1 }, // Expecting 1 file for 'poster'
      { name: 'video', maxCount: 1 }, // Expecting 1 file for 'video'
    ]),
  )
  async update(
    @Param('title') title: string,
    @Body() updateDto: UpdateMovieDto,
    @UploadedFiles()
    uploadedFiles: {
      poster?: Express.Multer.File;
      video?: Express.Multer.File;
    },
  ) {
    const files = {
      poster: uploadedFiles.poster ? uploadedFiles.poster[0] : undefined,
      video: uploadedFiles.video ? uploadedFiles.video[0] : undefined,
    };
    return this.movieService.update(title, updateDto, files);
  }

  @Delete(':title')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
