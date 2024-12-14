import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    // Check if user data exists
    const user = request.user;
    if (!user) {
      throw new Error('User not found in request context');
    }

    // If specific data is requested, return the respective field, else return the entire user object
    if (data) {
      if (!(data in user)) {
        throw new Error(`User does not have the field: ${data}`);
      }
      return user[data];
    }
    return user;
  },
);
