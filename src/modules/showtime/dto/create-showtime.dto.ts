import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateFormat, IsLocationFormat } from '../decorator';

export class CreateShowtimeDto {
  @ApiProperty({
    example: '2024-12-31',
    description:
      'The start time of the showtime in ISO8601 format [2024-12-31T22:00:00Z].',
    required: true,
    type: 'string',
    format: 'date-time',
  })
  @IsDateFormat({
    message: 'Start time must be in ISO8601 format',
  })
  startTime: Date;

  @ApiProperty({
    example: '2024-12-31',
    description: 'The end time of the showtime in ISO8601 format.',
    required: true,
    type: 'string',
    format: 'date-time',
  })
  @IsDateFormat({
    message: 'End time must be in ISO8601 format',
  })
  endTime: Date;

  @ApiProperty({
    example: 50,
    description: 'The maximum number of seats available for the showtime.',
    required: true,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  capacity: number;

  @ApiProperty({
    example: 'New York, Broadway Theater',
    description: 'The location of the showtime in the format "City, Venue".',
    required: true,
    type: 'string',
  })
  @IsLocationFormat({
    message: 'Location must follow the format "City, Venue"',
  })
  location: string;
}
