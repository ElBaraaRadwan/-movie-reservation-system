import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';
import { IsDateFormat, IsLocationFormat } from '../decorator';

export class CreateShowtimeDto {
  @IsDateFormat({
    message: 'Start time must be in ISO8601 format',
  })
  startTime: Date;

  @IsDateFormat({
    message: 'End time must be in ISO8601 format',
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
