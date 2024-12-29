import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({
    example: 'Inception',
    description: 'The title of the movie',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'A mind-bending thriller about dreams within dreams.',
    description: 'The description of the movie',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Sci-Fi',
    description: 'The genre of the movie',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  genre: string;
}
