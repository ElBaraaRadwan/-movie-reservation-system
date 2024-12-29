import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { UpdateShowtimeDto, CreateShowtimeDto } from './dto';
import { Role } from '@prisma/client';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Showtimes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('showtime')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @ApiOperation({ summary: 'Create a new showtime for a movie' })
  @ApiResponse({
    status: 201,
    description: 'Showtime created successfully.',
    schema: {
      example: {
        id: 1,
        title: 'Inception',
        startTime: '2024-12-31T20:00:00Z',
        endTime: '2024-12-31T22:00:00Z',
        capacity: 50,
        location: 'New York, Broadway Theater',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires admin role.' })
  @ApiParam({
    name: 'title',
    description:
      'The title of the movie for which the showtime is being created.',
    required: true,
    type: 'string',
  })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':title')
  create(@Body() createDto: CreateShowtimeDto, @Param('title') title: string) {
    return this.showtimeService.create(createDto, title);
  }

  @ApiOperation({ summary: 'Get a showtime by movie title' })
  @ApiResponse({
    status: 200,
    description: 'Showtime details retrieved successfully.',
    schema: {
      example: {
        id: 1,
        title: 'Inception',
        startTime: '2024-12-31T20:00:00Z',
        endTime: '2024-12-31T22:00:00Z',
        capacity: 50,
        location: 'New York, Broadway Theater',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Showtime not found.' })
  @ApiParam({
    name: 'title',
    description: 'The title of the movie.',
    required: true,
    type: 'string',
  })
  @Get(':title')
  findOne(@Param('title') title: string) {
    return this.showtimeService.findOne(title);
  }

  @ApiOperation({ summary: 'Get all showtimes' })
  @ApiResponse({
    status: 200,
    description: 'List of all showtimes retrieved successfully.',
    schema: {
      example: [
        {
          id: 1,
          title: 'Inception',
          startTime: '2024-12-31T20:00:00Z',
          endTime: '2024-12-31T22:00:00Z',
          capacity: 50,
          location: 'New York, Broadway Theater',
        },
        {
          id: 2,
          title: 'Avatar',
          startTime: '2024-12-31T18:00:00Z',
          endTime: '2024-12-31T20:30:00Z',
          capacity: 75,
          location: 'Los Angeles, Dolby Theater',
        },
      ],
    },
  })
  @Get('find/all')
  findAll() {
    return this.showtimeService.findAll();
  }

  @ApiOperation({ summary: 'Update a showtime by movie title' })
  @ApiResponse({
    status: 200,
    description: 'Showtime updated successfully.',
    schema: {
      example: {
        id: 1,
        title: 'Inception',
        startTime: '2024-12-31T20:30:00Z',
        endTime: '2024-12-31T22:30:00Z',
        capacity: 60,
        location: 'New York, Broadway Theater',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 404, description: 'Showtime not found.' })
  @ApiParam({
    name: 'title',
    description:
      'The title of the movie for which the showtime is being updated.',
    required: true,
    type: 'string',
  })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':title')
  update(@Param('title') title: string, @Body() updateDto: UpdateShowtimeDto) {
    return this.showtimeService.update(title, updateDto);
  }

  @ApiOperation({ summary: 'Delete a showtime by movie title' })
  @ApiResponse({
    status: 200,
    description: 'Showtime deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Showtime not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires admin role.' })
  @ApiParam({
    name: 'title',
    description:
      'The title of the movie for which the showtime is being deleted.',
    required: true,
    type: 'string',
  })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.showtimeService.remove(title);
  }
}
