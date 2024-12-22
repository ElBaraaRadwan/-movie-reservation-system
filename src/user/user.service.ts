import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  async create(
    DTO: CreateUserDto,
    role: Role = Role.CUSTOMER, // Default to Role.CUSTOMER if no role is provided
  ): Promise<UserEntity> {
    const { email, password } = DTO;

    // Check if the user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Create the new user
    const user = await this.prisma.user.create({
      data: {
        ...DTO,
        password: await bcrypt.hash(password, 10),
        role: role, // Assign the role (either passed or default)
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${user.id}`);
    await this.cacheManager.del('users:all');

    return new UserEntity(user);
  }

  async findOne(query: Record<string, any>): Promise<UserEntity> {
    try {
      // Validate and convert query parameters to match Prisma schema types
      const parsedQuery: Record<string, any> = {};
      for (const [key, value] of Object.entries(query)) {
        if (key === 'id') {
          // Parse id as a number if it is expected to be an integer
          parsedQuery[key] = parseInt(value, 10);
          if (isNaN(parsedQuery[key])) {
            throw new Error(`Invalid value for ${key}: ${value}`);
          }
        } else {
          parsedQuery[key] = value;
        }
      }

      // Generate a cache key based on the parsed query
      const cacheKey = `user:${JSON.stringify(parsedQuery)}`;

      // Check Redis for cached user
      const cachedUser = await this.cacheManager.get<UserEntity>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      // Query the database for the user
      const user = await this.prisma.user.findFirst({
        where: parsedQuery,
      });

      if (!user) {
        const queryParams = Object.entries(query)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        throw new NotFoundException(`User not found with: ${queryParams}`);
      }

      await this.cacheManager.set(cacheKey, user, 300);

      return new UserEntity(user);
    } catch (error) {
      console.error('Error in findUser:', error);
      throw new NotFoundException('Failed to find user with: ' + error);
    }
  }

  // Get all users
  async findAll(): Promise<UserEntity[]> {
    const cacheKey = 'users:all';
    const cachedUsers = await this.cacheManager.get<UserEntity[]>(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.prisma.user.findMany();
    const userEntities = users.map((user) => new UserEntity(user));

    // Cache the result
    await this.cacheManager.set(cacheKey, userEntities, 300);

    return userEntities;
  }

  // Update a user by id
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Ensure the user exists first
    await this.findOne({ id }); // Using helper function to find user

    // Check if the new email already exists
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del('users:all');

    return new UserEntity(updatedUser);
  }

  // Delete a user by id
  async remove(id: number): Promise<UserEntity> {
    try {
      // Ensure the user exists first
      await this.findOne({ id });

      const deletedUser = await this.prisma.user.delete({ where: { id } });

      // Invalidate cache
      await this.cacheManager.del(`user:${id}`);
      await this.cacheManager.del('users:all');

      return new UserEntity(deletedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to delete user');
      }
    }
  }

  // this func used for creating Google user
  async getOrCreateUser(DTO: {
    email: string;
    username: string;
    googleId: string;
    password: string;
  }): Promise<UserEntity> {
    const user = await this.findOne({ email: DTO.email });
    if (user) {
      return user;
    }
    return this.create(DTO);
  }
}
