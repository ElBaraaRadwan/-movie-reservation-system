import { IsInt, Min, IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty({ message: 'Movie title is required' })
  movieTitle: string;

  @IsInt()
  @Min(1, { message: 'Seats reserved must be at least 1' })
  @IsNotEmpty({ message: 'Seats reserved is required' })
  seatsReserved: number;
}
