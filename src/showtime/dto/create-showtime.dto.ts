import {
  IsDate,
  IsInt,
  IsString,
  IsNotEmpty,
  Min,
  MaxLength,
} from '@nestjs/class-validator';

export class CreateShowtimeDto {
  @IsInt()
  @IsNotEmpty()
  movieId: number;

  @IsDate()
  @IsNotEmpty()
  startTime: Date;

  @IsDate()
  @IsNotEmpty()
  endTime: Date;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacity: number;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  location: string;
}
