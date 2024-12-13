import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto } from './dto';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('create/:movieTitle')
  create(
    @Param('movieTitle') movieTitle: string,
    @Body() createDto: CreateReservationDto,
  ) {
    return this.reservationService.create(
      { ...createDto, movieTitle },
      1, // Example userId (replace with actual user context)
    );
  }

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Patch('update/:movieTitle')
  update(
    @Param('movieTitle') movieTitle: string,
    @Body() updateDto: UpdateReservationDto,
  ) {
    return this.reservationService.update(movieTitle, updateDto);
  }

  @Delete('delete/:movieTitle')
  remove(@Param('movieTitle') movieTitle: string) {
    return this.reservationService.remove(movieTitle);
  }
}
