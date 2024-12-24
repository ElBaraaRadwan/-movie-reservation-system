import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import { CreateUserDto } from '../src/modules/user/dto';
import { CreateMovieDto } from '../src/modules/movie/dto';
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
  let movieDTO: CreateMovieDto;
  let adminDTO: CreateUserDto;
  let adminLoginDTO = { email: 'admin@example.com', password: 'admin123' };
  let customerLoginDTO = {
    email: 'customer@example.com',
    password: 'customer123',
  };

  beforeAll(async () => {
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
    await prisma.cleanDB(); // Clean the database
    // await redis.cleanDB(); // Clean the redis database
    // await cloudinary.cleanDB(); // Clean the cloudinary database
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
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should not create an existed admin user', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(adminDTO)
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.CONFLICT);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(customerDTO)
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Logout', () => {
      it('should logout as a customer', async () => {
        await pactum
          .spec()
          .post('/auth/logout')
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should logout as an admin', async () => {
        await pactum
          .spec()
          .post('/auth/logout')
          .withCookies(admin_access_token)
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
          .withCookies(customer_refresh_token)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should refresh token as an admin', async () => {
        await pactum
          .spec()
          .post('/auth/refresh')
          .withCookies(admin_refresh_token)
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
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.OK);
      });
      it('should return admin profile', async () => {
        await pactum
          .spec()
          .get('/auth/profile')
          .withCookies(admin_access_token)
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
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .get('/user/all')
          .withCookies(customer_access_token)
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
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should update a customer', async () => {
        await pactum
          .spec()
          .patch('/user/2')
          .withJson({ username: 'newCustomerUser' })
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid user', async () => {
        await pactum
          .spec()
          .patch('/user/30')
          .withJson({ username: 'newCustomerUser' })
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });

    describe('Delete User', () => {
      it('should delete a user', async () => {
        await pactum
          .spec()
          .delete('/user/2')
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should return NOT FOUND for invalid user', async () => {
        await pactum
          .spec()
          .delete('/user/30')
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe('Movies', () => {
    describe('Get all movies', () => {
      it('should return all movies to login users', async () => {
        await pactum
          .spec()
          .get('/movie/all')
          .withCookies(admin_access_token)
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
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.OK);
      });

      it('should return NULL for invalid movie', async () => {
        await pactum
          .spec()
          .get('/movie/FakeName')
          .withCookies(admin_access_token)
          .expectBody(null);
      });
    });
    describe('Movie Stream', () => {});
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

        // Create a FormData instance
        const formData = new FormData();
        formData.append('title', 'New Movie');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');
        formData.append('poster', fs.createReadStream(posterPath));
        formData.append('video', fs.createReadStream(videoPath));

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: admin_access_token,
          })
          .withBody(formData)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            title: 'New Movie',
            description: 'A great movie',
            genre: 'Drama',
          });
      });

      it('should return BAD REQUEST for missing files', async () => {
        const formData = new FormData();
        formData.append('title', 'New Movie');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: admin_access_token,
          })
          .withBody(formData)
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

        // Create a FormData instance
        const formData = new FormData();
        formData.append('title', 'Inception');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');
        formData.append('poster', fs.createReadStream(posterPath));
        formData.append('video', fs.createReadStream(videoPath));

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: admin_access_token,
          })
          .withBody(formData)
          .expectStatus(HttpStatus.CONFLICT);
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

        // Create a FormData instance
        const formData = new FormData();
        formData.append('title', 'New Movie');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');
        formData.append('poster', fs.createReadStream(posterPath));
        formData.append('video', fs.createReadStream(videoPath));

        await pactum
          .spec()
          .post('/movie/create')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: customer_access_token,
          })
          .withBody(formData)
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

        // Create a FormData instance
        const formData = new FormData();
        formData.append('title', 'Inception');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');
        formData.append('poster', fs.createReadStream(posterPath));
        formData.append('video', fs.createReadStream(videoPath));

        await pactum
          .spec()
          .patch('/movie/Inception')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: admin_access_token,
          })
          .withBody(formData)
          .expectStatus(HttpStatus.OK)
          .expectJsonLike({
            title: 'Inception',
            description: 'A great movie',
            genre: 'Drama',
          });
      });

      it('should return BAD REQUEST for missing files', async () => {
        const formData = new FormData();
        formData.append('title', 'Inception');
        formData.append('description', 'A great movie');
        formData.append('genre', 'Drama');

        await pactum
          .spec()
          .patch('/movie/Inception')
          .withHeaders({
            ...formData.getHeaders(),
            Cookie: admin_access_token,
          })
          .withBody(formData)
          .expectStatus(HttpStatus.BAD_REQUEST);
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

  //   describe('Showtimes', () => {
  //     describe('Get all showtimes', () => {});
  //     describe('Get showtime by title', () => {});
  //     describe('Create showtime', () => {});
  //     describe('Update showtime', () => {});
  //     describe('Delete showtime', () => {});
  //   });

  //   describe('Reservations', () => {
  //     describe('Create reservation', () => {});
  //     describe('Get All reservations', () => {});
  //     describe('Get my reservations', () => {});
  //     describe('Update reservation', () => {});
  //     describe('Delete reservation', () => {});
  //   });
});
