import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.movieService.create(createMovieDto);
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
  update(
    @Param('title') title: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.movieService.update(title, updateMovieDto);
  }

  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
