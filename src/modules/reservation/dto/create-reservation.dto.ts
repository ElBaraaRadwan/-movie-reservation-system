import { IsInt, Min, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    example: 'Inception',
    description: 'The title of the movie for which the reservation is made',
    required: true,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty({ message: 'Movie title is required' })
  movieTitle: string;

  @ApiProperty({
    example: 2,
    description: 'The number of seats reserved',
    required: true,
    type: 'integer',
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'Seats reserved must be at least 1' })
  @IsNotEmpty({ message: 'Seats reserved is required' })
  seatsReserved: number;
}
