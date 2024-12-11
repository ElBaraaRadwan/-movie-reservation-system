import { Exclude, Expose } from '@nestjs/class-transformer';

export class UserEntity {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Exclude() // Don't include password in the response
  password: string;

  @Expose()
  role: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  refreshToken?: string;

  // Add a constructor to easily create instances of the class
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
