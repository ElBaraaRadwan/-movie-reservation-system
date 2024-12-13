import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { CreateShowtimeDto } from './dto';
import { UpdateShowtimeDto } from './dto';

@Controller('showtime')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @Post()
  create(@Body() createDto: CreateShowtimeDto, @Param('title') title: string) {
    return this.showtimeService.create(createDto, title);
  }

  @Get()
  findAll() {
    return this.showtimeService.findAll();
  }

  @Patch(':title')
  update(@Param('title') title: string, @Body() updateDto: UpdateShowtimeDto) {
    return this.showtimeService.update(title, updateDto);
  }

  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.showtimeService.remove(title);
  }
}
