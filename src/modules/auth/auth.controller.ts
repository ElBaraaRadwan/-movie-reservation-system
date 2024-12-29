import { Controller, Post, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleGuard, JwtGuard, JwtRefreshGuard } from './guard';
import { GetUser } from './decorator';
import { UserEntity } from 'src/modules/user/entities';
import { LocalGuard } from './guard/local.guard';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Log in with username and password' })
  @ApiResponse({
    status: 201,
    description: 'Login successful. Tokens are set in cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res);
  }

  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Access token refreshed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res);
  }

  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth login page',
  })
  @Get('google')
  @UseGuards(GoogleGuard)
  loginGoogle() {}

  @ApiOperation({ summary: 'Google OAuth login callback' })
  @ApiResponse({
    status: 201,
    description: 'Login successful via Google OAuth.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired Google credentials',
  })
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(
    @GetUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(user, res, true);
  }

  @ApiOperation({ summary: 'Log out and clear authentication cookies' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful. Authentication cookies cleared.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('logout')
  async logOut(@GetUser() user: UserEntity, @Res() res: Response) {
    await this.authService.logOut(user, res);
  }

  @ApiOperation({ summary: 'Get user profile information' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('profile')
  getUserInfo(@GetUser() user: UserEntity) {
    return user;
  }
}
