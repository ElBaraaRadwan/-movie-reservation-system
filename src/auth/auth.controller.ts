import { Controller, Post, Body, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard, JwtRefreshGuard, RolesGuard } from './guard';
import { Roles } from './decorator';
import { Role } from '@prisma/client';
import { GetUser } from './decorator';
import { UserEntity } from 'src/user/entities';
import { LocalGuard } from './guard/local.guard';
import { Response } from 'express';
import { CreateUserDto } from 'src/user/dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
  ) {}

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

  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res);
  }

  @Get('google')
  @UseGuards()
  loginGoogle() {}

  @Get('google/callback')
  @UseGuards()
  async googleCallback(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res, true);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logOut(@GetUser() user: UserEntity) {
    await this.authService.logOut(user);
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  getUserInfo(@GetUser() user: UserEntity) {
    console.log(`GetUserInfo: ${user}`);

    return user;
  }
}
