import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  cleanDB() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDB can only be run in test environment');
    }
    return this.$transaction([
      this.showtime.deleteMany(),
      this.reservation.deleteMany(),
      this.movie.deleteMany(),
      this.user.deleteMany(),
    ]);
  }

  async seedDB() {
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
