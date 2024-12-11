import { Injectable } from '@nestjs/common';
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
      throw new Error('Email already in use');
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

    return this.signToken(newUser);
  }

  // Login an existing user
  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validate the password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    return this.signToken(user);
  }

  // Generate a JWT token
  async signToken(user: {
    id: number;
    email: string;
    role: Role;
  }): Promise<{ accessToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.JWT.signAsync(payload, {
      expiresIn: '30m',
      secret,
    });
    return { accessToken: token };
  }
}
