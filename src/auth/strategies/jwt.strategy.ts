import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: number; // user id
    username: string;
    email: string;
    role: Role;
  }): Promise<Omit<{ password: string }, 'password'>> {
    console.log('JwtStrategy:', payload);

    const user = await this.userService.findOne({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('Invalid token: user not found');
    }

    console.log('JwtStrategy:', user);
    return user;
  }
}
