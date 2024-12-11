import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly JWT: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Sign up a new user
  async signup(dto: SignupDto) {
    const { email, password } = dto;

    // Check if the user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ForbiddenException('Email already in use');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.CUSTOMER, // default role
      },
    });

    return this.generateTokens(newUser);
  }

  // Login an existing user
  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    // Validate the password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new ForbiddenException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  // Generate a JWT token
  private async generateTokens(user: {
    id: number;
    email: string;
    role: Role;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.JWT.signAsync(payload, {
      expiresIn: '30m',
      secret: this.config.get('JWT_SECRET'),
    });

    const refreshToken = await this.JWT.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_SECRET'),
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Validate the refresh token
      const decoded = this.JWT.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // Fetch the user based on the decoded token
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || user.refreshToken !== refreshToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      // Generate a new access token
      return (await this.generateTokens(user)).accessToken;
    } catch (error) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }
}
