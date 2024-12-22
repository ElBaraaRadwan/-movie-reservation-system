import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token,
      ]),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: number; // user id
    username: string;
    email: string;
    role: Role;
  }) {
    const user = await this.userService.findOne({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('Invalid token: user not found');
    }

    return user;
  }
}
