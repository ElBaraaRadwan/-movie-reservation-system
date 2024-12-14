import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from 'src/user/entities';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    // Check if user data exists
    const user: UserEntity = request.user as UserEntity;
    if (!user) {
      throw new Error('User not found in request context');
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // If specific data is requested, return the respective field, else return the entire user object
    if (data) {
      if (!(data in userWithoutPassword)) {
        throw new Error(`User does not have the field: ${data}`);
      }
      return userWithoutPassword[data];
    }
    return userWithoutPassword;
  },
);
