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
import { Request, Response } from 'express';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard, RolesGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator';
import { Role } from '@prisma/client';
import { use } from 'passport';

@UseGuards(JwtGuard)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post('/create')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('files'))
  create(
    @Body() dto: CreateMovieDto,
    @UploadedFiles()
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    return this.movieService.create(dto, files);
  }

  @Get('stream/:title')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  streamMovie(@Param('title') title: string, req: Request, res: Response) {
    return this.movieService.streamMovie(title, req, res);
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
