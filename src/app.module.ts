import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MovieModule } from './movie/movie.module';
import { ShowtimeModule } from './showtime/showtime.module';
import { ReservationModule } from './reservation/reservation.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './movie/cloudinary/cloudinary.service';
import { RedisModule } from './redis/redis.module';

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
