import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
} from '@nestjs/class-validator';

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

  @IsUrl()
  @IsNotEmpty()
  videoUrl: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  resolution: string[];

  @IsNotEmpty()
  @IsNumber()
  duration: number;
}
