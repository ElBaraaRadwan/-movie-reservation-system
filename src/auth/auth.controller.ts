import { Controller, Post, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard, JwtRefreshGuard } from './guard';
import { GetUser } from './decorator';
import { UserEntity } from 'src/user/entities';
import { LocalGuard } from './guard/local.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

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
  async logOut(@GetUser() user: UserEntity, @Res() res: Response) {
    await this.authService.logOut(user, res);
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  getUserInfo(@GetUser() user: UserEntity) {
    return user;
  }
}
