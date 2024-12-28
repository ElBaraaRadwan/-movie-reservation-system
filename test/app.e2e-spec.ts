import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import * as path from 'path';
import { CreateUserDto } from '../src/modules/user/dto';
import { RedisService } from '../src/redis/redis.service';
import { CloudinaryService } from '../src/modules/movie/cloudinary/cloudinary.service';

describe('APP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let cloudinary: CloudinaryService;
  let admin_access_token: string;
  let customer_access_token: string;
  let admin_refresh_token: string;
  let customer_refresh_token: string;
  let customerDTO: CreateUserDto;
  let adminDTO: CreateUserDto;
  let adminLoginDTO = { email: 'admin@example.com', password: 'admin123' };
  let customerLoginDTO = {
    email: 'customer@example.com',
    password: 'customer123',
  };

  beforeAll(async () => {
    jest.setTimeout(60000);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(3002);

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    cloudinary = app.get(CloudinaryService);
    await Promise.all([
      prisma.cleanDB(),
      //   redis.cleanDB(),
      //   cloudinary.cleanDB(),
    ]);
    await prisma.seedDB(); // Seed the database
    pactum.request.setBaseUrl('http://localhost:3001');

    customerDTO = {
      email: 'customer1@example.com',
      password: 'customer123',
      username: 'customerUser',
    };
    adminDTO = {
      email: 'admin1@example.com',
      password: 'admin123',
      username: 'adminUser',
      role: 'ADMIN',
    };

    const adminRes = await pactum
      .spec()
      .post('/auth/login')
      .withJson(adminLoginDTO)
      .expectStatus(HttpStatus.CREATED);

    const customerRes = await pactum
      .spec()
      .post('/auth/login')
      .withJson(customerLoginDTO)
      .expectStatus(HttpStatus.CREATED);

    customer_access_token = customerRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('access_token'))
      .split(';')[0];
    admin_access_token = adminRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('access_token'))
      .split(';')[0];
    customer_refresh_token = customerRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('refresh_token'))
      .split(';')[0];
    admin_refresh_token = adminRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('refresh_token'))
      .split(';')[0];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    describe('SignUp', () => {
      it('should create a new user', async () => {
        await pactum
          .spec()
          .post('/user/signup')
          .withJson(customerDTO)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should create a new admin user as an admin', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(adminDTO)
          .withHeaders({
            Cookie: admin_access_token,
          })
          .expectStatus(HttpStatus.CREATED);
      });

      it('should not create an existed admin user', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(adminDTO)
          .withHeaders({
            Cookie: admin_access_token,
          })
          .expectStatus(HttpStatus.CONFLICT);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(customerDTO)
          .withHeaders({
            Cookie: customer_access_token,
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('Logout', () => {
      it('should logout as a customer', async () => {
        await pactum
          .spec()
          .post('/auth/logout')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should logout as an admin', async () => {
        await pactum
          .spec()
          .post('/auth/logout')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });
    });

    describe('Login', () => {
      it('should login as a customer', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson(customerLoginDTO)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should login as an admin', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson(adminLoginDTO)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should return UNAUTHORIZED for invalid credentials', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withJson({ email: 'lol@example.com', password: '123321' })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('Refresh Token', () => {
      it('should refresh token as a customer', async () => {
        await pactum
          .spec()
          .post('/auth/refresh')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.CREATED);
      });

      it('should refresh token as an admin', async () => {
        await pactum
          .spec()
          .post('/auth/refresh')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('Google Login', () => {
      it('should login with google', async () => {
        await pactum.spec().get('/auth/google').expectStatus(HttpStatus.FOUND);
      });
    });

    describe('Google Callback', () => {
      it('should login with google', async () => {
        await pactum
          .spec()
          .get('/auth/google/callback')
          .expectStatus(HttpStatus.FOUND);
      });
    });

    describe('Get User Profile', () => {
      it('should return customer profile', async () => {
        await pactum
          .spec()
          .get('/auth/profile')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });
      it('should return admin profile', async () => {
        await pactum
          .spec()
          .get('/auth/profile')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });
    });
  });

  describe('Users', () => {
    describe('Find All Users', () => {
      it('should return all users as an admin', async () => {
        await pactum
          .spec()
          .get('/user/all')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .get('/user/all')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });

    describe('Find User', () => {
      it('should return a user using email', async () => {
        await pactum
          .spec()
          .get('/user/find')
          .withQueryParams({ email: 'admin@example.com' })
          .expectStatus(HttpStatus.OK);
      });

      it('should return a user using username', async () => {
        await pactum
          .spec()
          .get('/user/find')
          .withQueryParams({ username: 'adminUser' })
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid user', async () => {
        await pactum
          .spec()
          .get('/user/find')
          .withQueryParams({ email: 'lol@example.com' })
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });

    describe('Update User', () => {
      it('should update a admin', async () => {
        await pactum
          .spec()
          .patch('/user/1')
          .withJson({ username: 'newAdminUser' })
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should update a customer', async () => {
        await pactum
          .spec()
          .patch('/user/2')
          .withJson({ username: 'newCustomerUser' })
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid user', async () => {
        await pactum
          .spec()
          .patch('/user/30')
          .withJson({ username: 'newCustomerUser' })
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });

    describe('Delete User', () => {
      it('should delete a user', async () => {
        await pactum
          .spec()
          .delete('/user/2')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid user', async () => {
        await pactum
          .spec()
          .delete('/user/30')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe('Movies', () => {
    describe('Create movie', () => {
      it('should create a movie', async () => {
        const posterPath = path.resolve(
          __dirname,
          '../src/resources/poster1.jpg',
        );
        const videoPath = path.resolve(
          __dirname,
          '../src/resources/video1.mp4',
        );

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withFile('poster', posterPath)
          .withFile('video', videoPath)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withRequestTimeout(6000);
      });

      it('should return BAD REQUEST for missing files', async () => {
        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return CONFLICT for existing movie', async () => {
        const posterPath = path.resolve(
          __dirname,
          '../src/resources/poster1.jpg',
        );
        const videoPath = path.resolve(
          __dirname,
          '../src/resources/video1.mp4',
        );

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withFile('poster', posterPath)
          .withFile('video', videoPath)
          .expectStatus(HttpStatus.CONFLICT)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withRequestTimeout(6000);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        const posterPath = path.resolve(
          __dirname,
          '../src/resources/poster1.jpg',
        );
        const videoPath = path.resolve(
          __dirname,
          '../src/resources/video1.mp4',
        );

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withFile('poster', posterPath)
          .withFile('video', videoPath)
          .expectStatus(HttpStatus.FORBIDDEN)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withRequestTimeout(6000);
      });
    });
    describe('Get all movies', () => {
      it('should return all movies to login users', async () => {
        await pactum
          .spec()
          .get('/movie/all')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should not return movies to non login users', async () => {
        await pactum
          .spec()
          .get('/movie/all')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Get movie by title', () => {
      it('should return a movie by title', async () => {
        await pactum
          .spec()
          .get('/movie/Inception')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return NULL for invalid movie', async () => {
        await pactum
          .spec()
          .get('/movie/FakeName')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectBody(null);
      });
    });
    describe('Movie Stream', () => {
      it('should stream a movie', async () => {
        let movieTitle = 'Inception';
        await pactum
          .spec()
          .get(`/movie/${movieTitle}/stream`)
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return BAD REQUEST for invalid movie', async () => {
        let movieTitle = 'FakeName';
        await pactum
          .spec()
          .get(`/movie/${movieTitle}/stream`)
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        let movieTitle = 'Inception';
        await pactum
          .spec()
          .get(`/movie/${movieTitle}/stream`)
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Update movie', () => {
      it('should update a movie', async () => {
        const posterPath = path.resolve(
          __dirname,
          '../src/resources/poster1.jpg',
        );
        const videoPath = path.resolve(
          __dirname,
          '../src/resources/video1.mp4',
        );

        await pactum
          .spec()
          .patch('/movie/Inception')
          .withHeaders({
            Cookie: admin_access_token,
          })
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withFile('poster', posterPath)
          .withFile('video', videoPath)
          .expectStatus(HttpStatus.OK)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withRequestTimeout(6000);
      });

      it('should return BAD REQUEST for missing files', async () => {
        await pactum
          .spec()
          .patch('/movie/Inception')
          .withHeaders({
            Cookie: admin_access_token,
          })
          .withMultiPartFormData({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          })
          .withRequestTimeout(6000);
      });
    });
    describe('Delete movie', () => {
      it('should delete a movie', async () => {
        await pactum
          .spec()
          .delete('/movie/Inception')
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid movie', async () => {
        await pactum
          .spec()
          .delete('/movie/FakeName')
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe('Showtimes', () => {
    describe('Create showtime', () => {
      it('should create a showtime', async () => {
        await pactum
          .spec()
          .post('/showtime/create')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            date: '2021-12-12',
            time: '12:00',
            capacity: 100,
          })
          .expectStatus(HttpStatus.CREATED);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .post('/showtime/create')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            date: '2021-12-12',
            time: '12:00',
            capacity: 100,
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Get all showtimes', () => {
      it('should return all showtimes', async () => {
        await pactum
          .spec()
          .get('/showtime/all')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Get showtime by title', () => {
      it('should return a showtime by title', async () => {
        await pactum
          .spec()
          .get('/showtime/Inception')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return NULL for invalid showtime', async () => {
        await pactum
          .spec()
          .get('/showtime/FakeName')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectBody(null);
      });
    });
    describe('Update showtime', () => {
      it('should update a showtime', async () => {
        await pactum
          .spec()
          .patch('/showtime/Inception')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            date: '2021-12-12',
            time: '12:00',
            capacity: 100,
          })
          .expectStatus(HttpStatus.OK);
      });

      it('should return BAD REQUEST for invalid showtime', async () => {
        await pactum
          .spec()
          .patch('/showtime/FakeName')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            date: '2021-12-12',
            time: '12:00',
            capacity: 100,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .patch('/showtime/Inception')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            date: '2021-12-12',
            time: '12:00',
            capacity: 100,
          })
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Delete showtime', () => {
      it('should delete a showtime', async () => {
        await pactum
          .spec()
          .delete('/showtime/Inception')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .delete('/showtime/Inception')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('Reservations', () => {
    describe('Create reservation', () => {
      it('should create a reservation', async () => {
        await pactum
          .spec()
          .post('/reservation/create')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            title: 'Inception',
            seatsReserved: 2,
          })
          .expectStatus(HttpStatus.CREATED);
      });

      it('should return FORBIDDEN for non login user', async () => {
        await pactum
          .spec()
          .post('/reservation/create')
          .withJson({
            title: 'Inception',
            seatsReserved: 2,
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return BAD REQUEST for invalid showtime', async () => {
        await pactum
          .spec()
          .post('/reservation/create')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            title: 'FakeName',
            seatsReserved: 2,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });
    describe('Get All reservations', () => {
      it('should return all reservations', async () => {
        await pactum
          .spec()
          .get('/reservation/all')
          .withHeaders(
            'Cookie',
            `${admin_access_token}; ${admin_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return UNAUTHORIZED for non login user', async () => {
        await pactum
          .spec()
          .get('/reservation/all')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .get('/reservation/all')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Get my reservations', () => {
      it('should return all reservations', async () => {
        await pactum
          .spec()
          .get('/reservation/my')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return UNAUTHORIZED for non login user', async () => {
        await pactum
          .spec()
          .get('/reservation/my')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Update reservation', () => {
      it('should update a reservation', async () => {
        await pactum
          .spec()
          .patch('/reservation/update')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            seatsReserved: 3,
            movieTitle: 'Inception',
          })
          .expectStatus(HttpStatus.OK);
      });

      it('should return Seats are not available', async () => {
        await pactum
          .spec()
          .patch('/reservation/update')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .withJson({
            seatsReserved: 300,
            movieTitle: 'Inception',
          })
          .expectBody('Seats are not available');
      });

      it('should return UNAUTHORIZED for non login user', async () => {
        await pactum
          .spec()
          .patch('/reservation/update')
          .withJson({
            seatsReserved: 3,
            movieTitle: 'Inception',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('Delete reservation', () => {
      it('should delete a reservation', async () => {
        await pactum
          .spec()
          .delete('/reservation/Inception')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid reservation', async () => {
        await pactum
          .spec()
          .delete('/reservation/FakeName')
          .withHeaders(
            'Cookie',
            `${customer_access_token}; ${customer_refresh_token}`,
          )
          .expectStatus(HttpStatus.NOT_FOUND);
      });

      it('should return UNAUTHORIZED for non login user', async () => {
        await pactum
          .spec()
          .delete('/reservation/Inception')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});
