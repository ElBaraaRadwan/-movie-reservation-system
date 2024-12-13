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

  @Get()
  findAll() {
    return this.movieService.findAll();
  }

  @Get(':title')
  findOneByName(@Param('title') title: string) {
    return this.movieService.findOneByName(title);
  }

  @Patch(':title')
  update(@Param('title') title: string, @Body() updateDto: UpdateMovieDto) {
    return this.movieService.update(title, updateDto);
  }

  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
