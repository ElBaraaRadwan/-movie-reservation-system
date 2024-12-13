import { IsInt, Min, IsNotEmpty } from '@nestjs/class-validator';

export class CreateReservationDto {
  @IsInt()
  @Min(1, { message: 'User ID must be a positive integer' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @IsInt()
  @Min(1, { message: 'Showtime ID must be a positive integer' })
  @IsNotEmpty({ message: 'Showtime ID is required' })
  showtimeId: number;

  @IsInt()
  @Min(1, { message: 'Seats reserved must be at least 1' })
  @IsNotEmpty({ message: 'Seats reserved is required' })
  seatsReserved: number;
}
