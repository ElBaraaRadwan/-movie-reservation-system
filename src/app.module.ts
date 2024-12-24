import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MovieModule } from './modules/movie/movie.module';
import { ShowtimeModule } from './modules/showtime/showtime.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { CloudinaryService } from './modules/movie/cloudinary/cloudinary.service';

@Module({
  imports: [
    AuthModule,
    UserModule,
    MovieModule,
    ShowtimeModule,
    ReservationModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
  ],
  providers: [CloudinaryService],
})
export class AppModule {}
