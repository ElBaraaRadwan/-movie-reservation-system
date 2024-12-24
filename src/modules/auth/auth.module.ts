import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  GoogleStrategy,
  JwtRefreshStrategy,
  JwtStrategy,
  LocalStrategy,
} from './strategies';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/modules/user/user.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
  ],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register Passport for JWT authentication
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to read environment variables
      inject: [ConfigService], // Inject ConfigService for accessing config values
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'), // Provide the JWT secret key from the environment variables
        signOptions: { expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') }, // Set the expiration time for the JWT token
      }),
    }),
    ConfigModule,
    UserModule,
    RedisModule,
  ],
})
export class AuthModule {}
