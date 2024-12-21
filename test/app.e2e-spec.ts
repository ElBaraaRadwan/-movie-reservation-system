import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { CreateUserDto } from '../src/user/dto';

describe('APP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin_access_token: string;
  let customer_access_token: string;
  let customerDTO: CreateUserDto;
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
    await app.listen(3001);

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

      //   it('should create a new admin user as an admin', async () => {
      //     await pactum
      //       .spec()
      //       .post('/user/signup/admin')
      //       .withJson(adminDTO)
      //       .withCookies(admin_access_token)
      //       .expectStatus(HttpStatus.CREATED);
      //   });

      //   it('should not create an existed admin user', async () => {
      //     await pactum
      //       .spec()
      //       .post('/user/signup/admin')
      //       .withJson(adminDTO)
      //       .withCookies(admin_access_token)
      //       .expectStatus(HttpStatus.CONFLICT);
      //   });

      it('should return unAuth for non admin user', async () => {
        await pactum
          .spec()
          .post('/user/signup/admin')
          .withJson(customerDTO)
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.UNAUTHORIZED);
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

      it('should return unAuth for non admin user', async () => {
        await pactum
          .spec()
          .get('/user/all')
          .withCookies(customer_access_token)
          .expectStatus(HttpStatus.UNAUTHORIZED);
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
    });
    describe('Update User', () => {
      //   it('should update a user', async () => {
      //     await pactum
      //       .spec()
      //       .patch('/user/189')
      //       .withJson({ username: 'newAdminUser' })
      //       .withCookies(admin_access_token[0])
      //       .expectStatus(HttpStatus.OK);
      //   });
    });
    describe('Delete User', () => {});
  });

  //   describe('Movies', () => {
  //     describe('Get all movies', () => {});
  //     describe('Get movie by title', () => {});
  //     describe('Movie Stream', () => {});
  //     describe('Create movie', () => {});
  //     describe('Update movie', () => {});
  //     describe('Delete movie', () => {});
  //   });

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
