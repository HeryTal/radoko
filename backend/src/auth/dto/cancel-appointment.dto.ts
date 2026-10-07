import { IsString, MinLength } from 'class-validator';

export class CancelAppointmentDto {
  @IsString()
  @MinLength(40)
  token!: string;
}
