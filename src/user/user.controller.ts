import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Post,
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

  @Post('signup')
  signUp(@Body() DTO: CreateUserDto) {
    return this.userService.create(DTO);
  }

  @Post('signup/admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  signUpAdmin(@Body() DTO: CreateUserDto) {
    return this.userService.create(DTO, Role.ADMIN);
  }

  @Get('find')
  findOne(@Query() query: Record<string, any>) {
    return this.userService.findOne(query);
  }

  @Get('all')
  @Roles(Role.ADMIN) // Only admin can view all users
  @UseGuards(JwtGuard, RolesGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Only admin can delete users
  @UseGuards(JwtGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
