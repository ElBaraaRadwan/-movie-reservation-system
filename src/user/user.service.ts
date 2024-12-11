import { Injectable } from '@nestjs/common';
import { SignupDto as CreateUserDto } from './dto';
import { UpdateUserDto } from './dto';
import { UserEntity } from './entities';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
