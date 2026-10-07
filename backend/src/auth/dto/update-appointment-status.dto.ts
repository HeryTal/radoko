import { IsIn } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED'])
  status!: 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
}
