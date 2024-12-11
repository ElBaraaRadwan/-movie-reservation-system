import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client'; // Assuming Role is an enum from Prisma

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // No role restriction, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // The user object should be available after JwtAuthGuard

    return requiredRoles.some((role) => user.role === role); // Check if the user's role matches
  }
}
