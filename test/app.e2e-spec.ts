import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

describe('APP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3330);

    prisma = app.get(PrismaService);
    await prisma.cleanDB();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    describe('Login', () => {});
    describe('Logout', () => {});
    describe('Google Login', () => {});
    describe('Google Callback', () => {});
    describe('Get User Profile', () => {});
  });

  describe('Users', () => {
    describe('Create Customer User', () => {});
    describe('Create Admin User', () => {});
    describe('Find All Users', () => {});
    describe('Find User', () => {});
    describe('Update User', () => {});
    describe('Delete User', () => {});
  });

  describe('Movies', () => {
    describe('Get all movies', () => {});
    describe('Get movie by title', () => {});
    describe('Movie Stream', () => {});
    describe('Create movie', () => {});
    describe('Update movie', () => {});
    describe('Delete movie', () => {});
  });

  describe('Showtimes', () => {
    describe('Get all showtimes', () => {});
    describe('Get showtime by title', () => {});
    describe('Create showtime', () => {});
    describe('Update showtime', () => {});
    describe('Delete showtime', () => {});
  });

  describe('Reservations', () => {
    describe('Create reservation', () => {});
    describe('Get All reservations', () => {});
    describe('Get my reservations', () => {});
    describe('Update reservation', () => {});
    describe('Delete reservation', () => {});
  });
});
