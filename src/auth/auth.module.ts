import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './strategies';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, GoogleStrategy],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register Passport for JWT authentication
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to read environment variables
      inject: [ConfigService], // Inject ConfigService for accessing config values
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), // Get JWT secret from environment variables
        signOptions: { expiresIn: '1h' }, // Set token expiration time to 1 hour
      }),
    }),
    ConfigModule,
  ],
})
export class AuthModule {}
