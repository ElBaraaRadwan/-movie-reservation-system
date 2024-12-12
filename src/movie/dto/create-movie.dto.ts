import { IsNotEmpty, IsString, IsUrl } from '@nestjs/class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  genre: string;

  @IsNotEmpty()
  @IsUrl()
  poster: string;

  @IsNotEmpty()
  @IsString()
  duration: string;
}
