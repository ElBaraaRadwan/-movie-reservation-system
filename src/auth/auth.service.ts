import { Injectable } from '@nestjs/common';
import { LoginDto, SignupDto } from './dto';

@Injectable()
export class AuthService {
  async signup(dto: SignupDto) {
    // Logic to create a new user
  }

  async login(dto: LoginDto) {
    // Logic to authenticate a user
  }
}
