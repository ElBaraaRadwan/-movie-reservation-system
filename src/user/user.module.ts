import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [UserController],
  imports: [RedisModule],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
