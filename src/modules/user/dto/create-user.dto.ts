import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The unique email of the user. Must be a valid email address.',
    required: true,
    type: 'string',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description:
      'The password for the user account. Must be at least 8 characters.',
    required: true,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'CUSTOMER',
    description:
      'The role of the user. Defaults to "CUSTOMER" if not provided.',
    required: false,
    enum: Role,
  })
  @IsString()
  @IsOptional()
  role?: Role;

  @ApiProperty({
    example: 'john_doe',
    description: 'The username for the user account. Must be unique.',
    required: true,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;
}
