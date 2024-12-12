import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleGuard } from './guard';

@UseGuards(GoogleGuard)
@Controller('auth/google')
export class GoogleController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  googleLogin() {
    // Deal with this later!
  }

  @Get('redirect')
  async googleRedirect(@Req() req: Request, @Res() res: Response) {
    const googleProfile = req.user as {
      googleId: string;
      email: string;
      username: string;
    };

    // Validate or create the user using the AuthService
    const user = await this.authService.validateGoogleUser({
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      username: googleProfile.username,
    });

    // Redirect or respond with user data
    res.redirect(`/profile?user=${encodeURIComponent(JSON.stringify(user))}`);
  }
}
