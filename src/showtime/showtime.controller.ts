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
import { CreateShowtimeDto } from './dto';
import { UpdateShowtimeDto } from './dto';
import { JwtGuard, RolesGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('showtime')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':title')
  create(@Body() createDto: CreateShowtimeDto, @Param('title') title: string) {
    return this.showtimeService.create(createDto, title);
  }

  @Get(':title')
  findOne(@Param('title') title: string) {
    return this.showtimeService.findOne(title);
  }

  @Get('/all')
  findAll() {
    return this.showtimeService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':title')
  update(@Param('title') title: string, @Body() updateDto: UpdateShowtimeDto) {
    return this.showtimeService.update(title, updateDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':title')
  remove(@Param('title') title: string) {
    return this.showtimeService.remove(title);
  }
}
