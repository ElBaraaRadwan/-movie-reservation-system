import { IsEmail, IsNotEmpty, IsString } from "@nestjs/class-validator";


export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;
}
