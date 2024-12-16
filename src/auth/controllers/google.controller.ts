import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import { GoogleGuard } from '../guard';

@Controller('auth/google')
export class GoogleController {
  //   constructor(private readonly authService: AuthService) {}
  //   @HttpCode(HttpStatus.OK)
  //   @Get()
  //   @Redirect()
  //   googleLogin() {
  //     const googleAuthUrl = this.authService.getGoogleAuthUrl();
  //     return { url: googleAuthUrl };
  //   }
  //   @UseGuards(GoogleGuard)
  //   @Get('redirect')
  //   async googleRedirect(@Req() req: Request, @Res() res: Response) {
  //     const googleProfile = req.user as {
  //       googleId: string;
  //       email: string;
  //       username: string;
  //     };
  //     // Validate or create the user using the AuthService
  //     const user = await this.authService.validateGoogleUser({
  //       googleId: googleProfile.googleId,
  //       email: googleProfile.email,
  //       username: googleProfile.username,
  //     });
  //     // Redirect or respond with user data
  //     res.redirect(`/profile?user=${encodeURIComponent(JSON.stringify(user))}`);
  //   }
}
