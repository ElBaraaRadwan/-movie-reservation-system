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
import { JwtGuard, RolesGuard } from 'src/auth/guard';
import { Role } from '@prisma/client';
import { GetUser, Roles } from 'src/auth/decorator';

@UseGuards(JwtGuard)
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post(':title')
  create(
    @Param('title') movieTitle: string,
    @Body() createDto: CreateReservationDto,
    @GetUser() user: any,
  ) {
    return this.reservationService.create(
      { ...createDto, movieTitle },
      user.id,
    );
  }

  @Get('/all')
  findAll() {
    return this.reservationService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':title')
  update(
    @Param('title') movieTitle: string,
    @Body() updateDto: UpdateReservationDto,
    @GetUser() user: any,
  ) {
    return this.reservationService.update(movieTitle, updateDto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':title')
  remove(@Param('title') movieTitle: string, @GetUser() user: any) {
    return this.reservationService.remove(movieTitle, user.id);
  }
}
