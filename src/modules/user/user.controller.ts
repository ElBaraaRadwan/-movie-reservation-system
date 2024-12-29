import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from '@prisma/client';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Users') // Groups all endpoints under "Users" in Swagger UI
@ApiBearerAuth() // Indicates that endpoints require Bearer Token authentication
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        username: 'john_doe',
        role: 'CUSTOMER',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @Post('signup')
  signUp(@Body() DTO: CreateUserDto) {
    return this.userService.create(DTO);
  }

  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin user created successfully.',
    schema: {
      example: {
        id: 2,
        email: 'admin@example.com',
        username: 'admin_user',
        role: 'ADMIN',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires admin role.' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('signup/admin')
  signUpAdmin(@Body() DTO: CreateUserDto) {
    return this.userService.create(DTO, Role.ADMIN);
  }

  @ApiOperation({ summary: 'Find a user by query' })
  @ApiQuery({
    name: 'email',
    description: 'The email of the user to find.',
    required: false,
  })
  @ApiQuery({
    name: 'username',
    description: 'The username of the user to find.',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'User found.',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        username: 'john_doe',
        role: 'CUSTOMER',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get('find')
  findOne(@Query() query: Record<string, any>) {
    return this.userService.findOne(query);
  }

  @ApiOperation({ summary: 'Find all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
    schema: {
      example: [
        {
          id: 1,
          email: 'user1@example.com',
          username: 'user1',
          role: 'CUSTOMER',
        },
        { id: 2, email: 'admin@example.com', username: 'admin', role: 'ADMIN' },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires admin role.' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    schema: {
      example: {
        id: 1,
        email: 'updated@example.com',
        username: 'updated_user',
        role: 'CUSTOMER',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires admin role.' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
