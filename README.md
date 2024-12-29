## Description

The **Movie Reservation System** is a backend application built using the NestJS framework to provide a robust, scalable, and efficient platform for managing movie reservations. The system allows users to explore movies, stream trailers, and make reservations while providing an admin interface for managing movies and reservations. This application employs a microservice-style architecture to ensure high modularity and easy extensibility.

The application integrates several tools and dependencies, enabling modern features such as file uploads (posters and videos), authentication (with JWT and OAuth), and database management. By leveraging PostgreSQL, Prisma ORM, and Docker, the system ensures data consistency and reliable operations. Additionally, the system is designed for seamless API interactions and offers comprehensive documentation using Swagger.

Key features of the application include:

- **User Authentication:** Local, JWT-based authentication and Google OAuth2 integration for secure access.
- **Movie Management:** Admins can create, update, delete, and manage movie data, including uploading trailers and posters via Cloudinary.
- **Streaming Capability:** Users can stream trailers directly through the platform with FFmpeg handling video streaming.
- **Reservation System:** A comprehensive mechanism for users to make and manage reservations for movies.
- **Admin Panel:** Role-based access control to manage the platform securely.
- **Testing:** The system is thoroughly tested using Jest for unit and end-to-end tests, ensuring reliability.
- **Scalability:** Built with modern tools and practices, including Docker and Redis for cache management.

The project is highly configurable and deployable, making it ideal for developers looking to build or extend a movie management platform.

---

## Tools & Dependencies

The main tools and dependencies used in this project:

<div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: nowrap;">

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://nestjs.com/img/logo-small.svg" alt="NestJS" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">NestJS</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://avatars.githubusercontent.com/u/17219288?s=200&v=4" alt="Prisma ORM" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Prisma ORM</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://img.icons8.com/?size=100&id=38561&format=png&color=000000" alt="PostgreSQL" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">PostgreSQL</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://img.icons8.com/fluency/48/000000/docker.png" alt="Docker" height="60" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Docker</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://img.icons8.com/color/48/000000/redis.png" alt="Redis" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Redis</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://logowik.com/content/uploads/images/cloudinary-icon8821.logowik.com.webp" alt="Cloudinary" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Cloudinary</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://img.icons8.com/color/48/000000/video.png" alt="FFmpeg" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">FFmpeg</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://static1.smartbear.co/swagger/media/assets/swagger_fav.png" alt="Swagger" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Swagger</p>
  </div>

  <div style="text-align: center; transition: transform 0.3s;">
    <img src="https://img.icons8.com/?size=100&id=3u82blvEilbF&format=png&color=000000" alt="Jest" height="80" style="transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"/>
    <p style="margin-top: 5px; font-size: 14px; font-weight: bold; display: none;">Jest</p>
  </div>

</div>


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
   - `PATCH /users/:id`: Update a user.
   - `DELETE /user/:id`: Admin delete a user.

---

### Postman Collection

You can find the Postman collection for testing all API routes here:
[Movie Reservation System on Postman](https://web.postman.co/workspace/94b8cafe-91d1-4800-84a1-6fa74bdae113/collection/17954957-83c9dc03-26d5-457c-8641-fa2871e7df85?action=share&source=copy-link&creator=17954957).

---

### Swagger Documentation

The Swagger API documentation is accessible once the application is running. Visit:

```
http://localhost:3000/api-docs
```

---

## License

This project is [MIT licensed](LICENSE).
