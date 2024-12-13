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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  @UseInterceptors(FileInterceptor('files'))
  create(
    @Body() dto: CreateMovieDto,
    @UploadedFiles()
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    return this.movieService.create(dto, files);
  }

  @Get('stream/:title')
  streamMovie(@Param('title') title: string, req: Request, res: Response) {
    return this.movieService.streamMovie(title, req, res);
  }

  @Get()
  findAll() {
    return this.movieService.findAll();
  }

  @Get(':title')
  findOneByName(@Param('title') title: string) {
    return this.movieService.findOneByName(title);
  }

  @Patch(':title')
  @UseInterceptors(FileInterceptor('files'))
  update(
    @Param('title') title: string,
    @Body() updateDto: UpdateMovieDto,
    @UploadedFiles()
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    return this.movieService.update(title, updateDto, files);
  }

  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
