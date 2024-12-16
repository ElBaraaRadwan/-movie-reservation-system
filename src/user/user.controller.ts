import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtGuard, RolesGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator';
import { Role } from '@prisma/client';

// @UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('find')
  findOne(@Query() query: Record<string, any>) {
    return this.userService.findOne(query);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Only admin can view all users
  findAll() {
    return this.userService.findAll();
  }

  @Patch(':email')
  update(@Param('email') email: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(email, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Only admin can delete users
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
