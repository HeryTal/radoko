import { IsISO8601 } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsISO8601({ strict: true })
  startsAt!: string;
}
