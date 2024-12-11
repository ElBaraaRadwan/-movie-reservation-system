import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MovieModule } from './movie/movie.module';
import { ShowtimeModule } from './showtime/showtime.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  imports: [AuthModule, UserModule, MovieModule, ShowtimeModule, ReservationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
