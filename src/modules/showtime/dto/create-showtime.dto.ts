import {
  IsInt,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { IsCustomDateFormat, IsLocationFormat } from '../decorator';

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

  @IsLocationFormat({
    message: 'Location must follow the format "City, Venue"',
  })
  location: string;
}
