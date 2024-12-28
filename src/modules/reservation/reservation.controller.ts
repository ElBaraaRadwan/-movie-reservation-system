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

@UseGuards(JwtGuard)
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('create')
  create(@Body() createDto: CreateReservationDto, @GetUser() user: UserEntity) {
    return this.reservationService.create(createDto, user.id);
  }

  @Get('my')
  findMyReservation(@GetUser() user: UserEntity) {
    return this.reservationService.findMyReservation(user.id);
  }

  @Get('/all')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.reservationService.findAll();
  }

  @Patch('update')
  update(@Body() updateDto: UpdateReservationDto, @GetUser() user: UserEntity) {
    return this.reservationService.update(updateDto, user.id);
  }

  @Delete(':title')
  remove(@Param('title') movieTitle: string, @GetUser() user: UserEntity) {
    return this.reservationService.remove(movieTitle, user.id);
  }
}
