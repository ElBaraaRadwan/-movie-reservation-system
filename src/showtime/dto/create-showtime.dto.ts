import {
  IsInt,
  IsString,
  IsNotEmpty,
  Min,
  MaxLength,
  Max,
} from '@nestjs/class-validator';
import { IsCustomDateFormat } from '../decorator';

export class CreateShowtimeDto {
  @IsInt()
  @IsNotEmpty()
  movieId: number;

  @IsCustomDateFormat({
    message: 'Start time must follow the format YYYY/MM/DD-HH:MMAM/PM',
  })
  startTime: Date;

  @IsCustomDateFormat({
    message: 'Start time must follow the format YYYY/MM/DD-HH:MMAM/PM',
  })
  endTime: Date;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  capacity: number;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  location: string;
}
