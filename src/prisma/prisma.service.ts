import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy, OnModuleInit
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connection established');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
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
          password: 'admin123',
          username: 'adminUser',
          role: 'ADMIN',
        },
        {
          email: 'customer@example.com',
          password: 'customer123',
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
