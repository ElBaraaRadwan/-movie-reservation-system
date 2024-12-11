import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto as CreateUserDto } from './dto';
import { UpdateUserDto } from './dto';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper function to handle user creation (with optional role)
  private async createUserWithRole(
    createUserDto: CreateUserDto,
    role?: Role,
  ): Promise<UserEntity> {
    const { email } = createUserDto;

    // Check if the user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Ensure the role is set if provided
    const userData = {
      ...createUserDto,
      role: role || Role.CUSTOMER, // Use provided role, fallback to the role in DTO
    };

    // Create the user
    const user = await this.prisma.user.create({
      data: userData,
    });

    return new UserEntity(user);
  }

  // Use function findUserById as Helper function
  async findUserById(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return new UserEntity(user);
  }

  // Create a new user
  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.createUserWithRole(createUserDto); // No role specified, defaults to user role
  }

  // Create an admin user
  async createAdmin(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.createUserWithRole(createUserDto, Role.ADMIN); // Explicitly set role to ADMIN
  }

  // Get all users
  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
  }

  // Update a user by id
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Ensure the user exists first
    await this.findUserById(id); // Using helper function to find user

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(updatedUser);
  }

  // Delete a user by id
  async remove(id: number): Promise<void> {
    // Ensure the user exists first
    await this.findUserById(id); // Using helper function to find user

    await this.prisma.user.delete({ where: { id } });
  }
}
