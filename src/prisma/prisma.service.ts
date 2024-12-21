import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  async cleanDB() {
    console.log('Environment:', process.env.NODE_ENV);
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDB can only be run in test environment');
    }
    console.log('Cleaning database...');
    await this.$transaction([
      this.showtime.deleteMany(),
      this.reservation.deleteMany(),
      this.movie.deleteMany(),
      this.user.deleteMany(),
    ]);

    await this.$executeRawUnsafe(
      'ALTER SEQUENCE "users_id_seq" RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE "movies_id_seq" RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE "reservations_id_seq" RESTART WITH 1',
    );
    await this.$executeRawUnsafe(
      'ALTER SEQUENCE "showtimes_id_seq" RESTART WITH 1',
    );
  }

  async seedDB() {
    console.log('Seeding database...');
    await this.user.createMany({
      data: [
        {
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          username: 'adminUser',
          role: 'ADMIN',
        },
        {
          email: 'customer@example.com',
          password: await bcrypt.hash('customer123', 10),
          username: 'customerUser',
          role: 'CUSTOMER',
        },
      ],
    });
    await this.movie.create({
      data: {
        title: 'Inception',
        description: 'Sci-Fi Movie',
        genre: 'action',
        poster: 'Non',
        videoUrl: 'Non',
        duration: 120,
      },
    });
  }
}
