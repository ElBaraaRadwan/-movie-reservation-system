import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
      // Dynamically query the database using Prisma
      const user = await this.prisma.user.findFirst({
        where: parsedQuery,
      });

      if (!user) {
        const queryParams = Object.entries(query)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        throw new NotFoundException(`${queryParams}`);
      }

      return new UserEntity(user);
    } catch (error) {
      console.error('Error in findUser:', (error as Error).message);
      throw new NotFoundException(
        'Failed to find user with: ' + (error as Error).message,
      );
    }
  }

  // Get all users
  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
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

    return new UserEntity(updatedUser);
  }

  // Delete a user by id
  async remove(id: number): Promise<UserEntity> {
    try {
      // Ensure the user exists first
      await this.findOne({ id });

      return await this.prisma.user.delete({ where: { id } });
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
