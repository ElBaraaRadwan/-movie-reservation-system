import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Assuming Role is an enum in Prisma

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
