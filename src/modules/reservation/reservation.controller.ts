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
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto } from './dto';
import { Role } from '@prisma/client';
import { UserEntity } from 'src/modules/user/entities';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation errors',
  })
  @Post('create')
  create(@Body() createDto: CreateReservationDto, @GetUser() user: UserEntity) {
    return this.reservationService.create(createDto, user.id);
  }

  @ApiOperation({ summary: 'Get all reservations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of reservations for the user',
  })
  @Get('my')
  findMyReservation(@GetUser() user: UserEntity) {
    return this.reservationService.findMyReservation(user.id);
  }

  @ApiOperation({ summary: 'Get all reservations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all reservations',
  })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('/all')
  findAll() {
    return this.reservationService.findAll();
  }

  @ApiOperation({ summary: 'Update a reservation for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Reservation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  @Patch('update')
  update(@Body() updateDto: UpdateReservationDto, @GetUser() user: UserEntity) {
    return this.reservationService.update(updateDto, user.id);
  }

  @ApiOperation({ summary: 'Delete a reservation by movie title' })
  @ApiResponse({
    status: 200,
    description: 'Reservation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  @Delete(':title')
  remove(@Param('title') movieTitle: string, @GetUser() user: UserEntity) {
    return this.reservationService.remove(movieTitle, user.id);
  }
}
