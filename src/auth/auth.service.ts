import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto';
import { LoginDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { UserEntity } from '../user/entities';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly JWT: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Helper function to handle user creation (with optional role)
  private async signUpUser(
    DTO: SignupDto,
    role: Role = Role.CUSTOMER, // Default to Role.CUSTOMER if no role is provided
  ): Promise<Omit<UserEntity, 'password'>> {
    const { email, password, username } = DTO;

    // Check if the user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role, // Assign the role (either passed or default)
      },
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword as Omit<UserEntity, 'password'>; // Return the user without the password field
  }

  // Create a new user
  async signUpCustomer(dto: SignupDto): Promise<Omit<UserEntity, 'password'>> {
    return await this.signUpUser(dto); // No role specified, defaults to user role
  }

  // Create an admin user
  async createAdmin(
    dto: SignupDto,
    req: any,
  ): Promise<Omit<UserEntity, 'password'>> {
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create admin users');
    }
    return await this.signUpUser(dto, Role.ADMIN); // Explicitly set role to ADMIN
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
    username: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    const accessToken = await this.JWT.signAsync(payload, {
      expiresIn: '30m',
      secret: this.config.get('JWT_SECRET'),
    });

    const refreshToken = await this.JWT.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_SECRET'),
    });

    // Store the refresh token in the user's record in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
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
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user || user.refreshToken !== refreshToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      // Generate a new access token
      return (await this.generateTokens(user)).accessToken;
    } catch (error) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async validateGoogleUser({
    googleId,
    email,
    username,
  }: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<UserEntity> {
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    // Hash the Google ID to use as a password
    const password = await bcrypt.hash(googleId, 10);
    // If the user doesn't exist, create a new user with the Google ID
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          username,
          password,
        },
      });
    }

    return new UserEntity(user);
  }

  getGoogleAuthUrl(): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URIS');
    const scope =
      'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const responseType = 'code';
    const accessType = 'offline';

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=${accessType}`;

    return googleAuthUrl;
  }
}
