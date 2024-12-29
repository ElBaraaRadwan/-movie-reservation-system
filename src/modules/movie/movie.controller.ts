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
  Res,
  Req,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorator';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Movies')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({
    status: 201,
    description: 'Movie created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Movie creation data with optional poster and video files',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Inception' },
        description: {
          type: 'string',
          example: 'A mind-bending thriller about dreams within dreams.',
        },
        genre: { type: 'string', example: 'Sci-Fi' },
        poster: {
          type: 'string',
          format: 'binary',
        },
        video: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('/create')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'poster', maxCount: 1 },
      { name: 'video', maxCount: 1 },
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

  @ApiOperation({ summary: 'Stream a movie by title' })
  @ApiResponse({
    status: 200,
    description: 'Movie streaming started',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @Get(':title/stream')
  streamMovie(
    @Param('title') title: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.movieService.streamMovie(title, req, res);
  }

  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({
    status: 200,
    description: 'List of all movies',
  })
  @Get('all')
  findAll() {
    return this.movieService.findAll();
  }

  @ApiOperation({ summary: 'Get details of a movie by title' })
  @ApiResponse({
    status: 200,
    description: 'Movie details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @Get(':title')
  findOneByName(@Param('title') title: string) {
    return this.movieService.findOneByName(title);
  }

  @ApiOperation({ summary: 'Update movie details' })
  @ApiResponse({
    status: 200,
    description: 'Movie updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Updated movie data with optional poster and video files',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Inception' },
        description: {
          type: 'string',
          example: 'Updated description for the movie.',
        },
        genre: { type: 'string', example: 'Sci-Fi' },
        poster: {
          type: 'string',
          format: 'binary',
        },
        video: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch(':title')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'poster', maxCount: 1 },
      { name: 'video', maxCount: 1 },
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

  @ApiOperation({ summary: 'Delete a movie by title' })
  @ApiResponse({
    status: 200,
    description: 'Movie deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @Delete(':title')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('title') title: string) {
    return this.movieService.remove(title);
  }
}
