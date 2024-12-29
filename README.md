## Description

A **Movie Reservation System** built using the [NestJS](https://github.com/nestjs/nest) framework. This project serves as a scalable backend for managing movie data, showtimes, reservations, and user authentication.

---

## Tools & Dependencies

The main tools and dependencies used in this project:

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS" height="100" />
  <img src="https://avatars.githubusercontent.com/u/17219288?s=200&v=4" alt="Prisma ORM" height="100" />
  <img src="https://img.icons8.com/?size=100&id=38561&format=png&color=000000" alt="PostgreSQL" height="100" />
  <img src="https://img.icons8.com/fluency/48/000000/docker.png" alt="Docker" height="100" />
  <img src="https://img.icons8.com/color/48/000000/redis.png" alt="Redis" height="100" />
  <img src="https://logowik.com/content/uploads/images/cloudinary-icon8821.logowik.com.webp" alt="Cloudinary" height="100" />
  <img src="https://img.icons8.com/color/48/000000/video.png" alt="FFmpeg" height="100" />
  <img src="https://static1.smartbear.co/swagger/media/assets/swagger_fav.png" alt="Swagger" height="100" />
  <img src="https://img.icons8.com/?size=100&id=3u82blvEilbF&format=png&color=000000" alt="Jest" height="100" />
</p>
---

## Project Setup

```bash
# Install dependencies
$ yarn install
```

---

## Compile and Run the Project

```bash
# development mode
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

---

## Run Tests

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

---

## To Start

```bash
$ yarn install

$ docker compose up -d

$ yarn start:dev

$ yarn test:e2e
```

---

## API Documentation

### Controllers (Routes)

The project exposes the following controllers:

1. **Auth Controller**:

   - `POST /auth/login`: Login with local strategy.
   - `GET /auth/google`: Google OAuth login.
   - `POST /auth/logout`: Logout the user.
   - `GET /auth/profile`: Fetch the logged-in user's profile.

2. **Movie Controller**:

   - `POST /movie/create`: Admin creates a movie with poster and video files.
   - `GET /movie/:title/stream`: Stream a movie video by title.
   - `GET /movie/all`: Fetch all movies.
   - `GET /movie/:title`: Fetch a movie by its title.
   - `PATCH /movie/:title`: Admin updates movie details.
   - `DELETE /movie/:title`: Admin deletes a movie.

3. **Showtime Controller**:

   - `POST /showtime/:title`: Admin creates a showtime for a movie.
   - `GET /showtime/:title`: Fetch a showtime for a movie.
   - `GET /showtime/find/all`: Fetch all showtimes.
   - `PATCH /showtime/:title`: Admin updates a showtime.
   - `DELETE /showtime/:title`: Admin deletes a showtime.

4. **Reservation Controller**:

   - `POST /reservation/create`: Create a reservation for a movie.
   - `GET /reservation/my`: Fetch reservations for the logged-in user.
   - `GET /reservation/all`: Admin fetches all reservations.
   - `PATCH /reservation/update`: Update a reservation.
   - `DELETE /reservation/:title`: Cancel a reservation for a movie.

5. **User Controller**:
   - `POST /users/signup`: Create a new user(customer).
   - `POST /users/signup/admin`: Create a new user(admin).
   - `GET /userr/all`: Admin fetches all users.
   - `PATCH /users/update`: Update a reservation.
   - `DELETE /reservation/:title`: Cancel a reservation for a movie.

---

## Test Suits

### End-to-End (E2E) Tests Summary

The following tests were conducted to ensure the functionality and reliability of the backend system:

#### **Authentication**
- **SignUp**: Successfully creates new users, including admin users, with appropriate restrictions for non-admins.
- **Logout**: Logs out both admin and customer users.
- **Login**: Validates credentials for customers and admins, rejecting invalid credentials.
- **Google Login/Callback**: Handles login and callback flow using Google OAuth.
- **Get User Profile**: Retrieves accurate profiles for logged-in users.

#### **Users**
- Retrieve all users (Admin-only access).
- Retrieve individual users by email or username.
- Update and delete users with proper validations.

#### **Movies**
- Retrieve all movies or specific movies by title.
- Enforce admin-only permissions for creating, updating, and deleting movies.
- Some movie-related features (e.g., streaming) require additional implementation or debugging.

#### **Showtimes**
- Retrieve all showtimes or a specific showtime by title.
- Admin-only permissions for creating, updating, and deleting showtimes.

#### **Reservations**
- Customers can view and create reservations.
- Admin-only permissions for viewing all reservations.
- Some reservation update/delete tests failed due to validation or business logic issues.

#### Total of 64 Tests
---

### Postman Collection

You can find the Postman collection for testing all API routes here:
[Movie Reservation System on Postman](https://web.postman.co/workspace/94b8cafe-91d1-41000-84a1-6fa74bdae113/collection/17954957-83c9dc03-26d5-457c-8641-fa2871e7df85?action=share&source=copy-link&creator=17954957).

---

### Swagger Documentation

The Swagger API documentation is accessible once the application is running. Visit:

```
http://localhost:3000/api-docs
```

### Project URL

[[Movie Reservation System URL](https://github.com/ElBaraaRadwan/movie-reservation-system).
](https://roadmap.sh/projects/movie-reservation-system)
---

---

## License

This project is [MIT licensed](LICENSE).
