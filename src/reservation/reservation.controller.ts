import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto';
import { UpdateReservationDto } from './dto';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createDto: CreateReservationDto) {
    return this.reservationService.create(createDto);
  }

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateReservationDto) {
    return this.reservationService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationService.remove(+id);
  }
}
