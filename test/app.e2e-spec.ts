import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { CreateUserDto } from '../src/user/dto';
import { CreateMovieDto } from '../src/movie/dto';
import * as path from 'path';

describe('APP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
      }),
    );
    await app.init();
    await app.listen(3002);

    prisma = app.get(PrismaService);
    await prisma.cleanDB(); // Clean the database
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

    console.log('admin Cookie:', adminRes.headers['set-cookie']);
    console.log('customer Cookie:', customerRes.headers['set-cookie']);
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

      it('should return NOT FOUND for invalid movie', async () => {
        await pactum
          .spec()
          .get('/movie/FakeName')
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });
    describe('Movie Stream', () => {});
    describe('Create movie', () => {
      const posterPath = path.join(
        'C:/Users/bebon/OneDrive/Изображения/Desktop-Wallpaper/undefined - Imgur (1).jpg',
      );
      const videoPath = path.join('C:/Users/bebon/Downloads/k.mp4');
      beforeAll(() => {
        movieDTO = {
          title: 'Matrix',
          description: 'A movie about dreams',
          duration: 120,
          genre: 'action',
          poster: posterPath,
          videoUrl: videoPath,
        };
      });

      it('should create a movie as an admin', async () => {
        await pactum
          .spec()
          .post('/movie/create')
          .withMultiPartFormData({
            title: movieDTO.title,
            description: movieDTO.description,
            duration: movieDTO.duration,
            genre: movieDTO.genre,
          })
          .withFile('poster', movieDTO.poster) // Add files using withFile
          .withFile('videoUrl', movieDTO.videoUrl) // Add files using withFile
          .withCookies(admin_access_token)
          .expectStatus(HttpStatus.CREATED)
          .inspect(); // This will log the full response
      });

      it('should return FORBIDDEN for non admin user', async () => {
        await pactum
          .spec()
          .post('/movie/create')
          .withMultiPartFormData({
            title: movieDTO.title,
            description: movieDTO.description,
            duration: movieDTO.duration,
            genre: movieDTO.genre,
          })
          .withFile('poster', movieDTO.poster) // Add files using withFile
          .withFile('videoUrl', movieDTO.videoUrl) // Add files using withFile
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Update movie', () => {});
    describe('Delete movie', () => {});
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
