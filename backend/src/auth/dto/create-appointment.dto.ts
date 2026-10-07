import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAppointmentDto {
  @IsBoolean()
  privacyConsent!: boolean;

  @IsISO8601({ strict: true })
  startsAt!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  patientName!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  patientEmail!: string;

  @Transform(trim)
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  patientPhone!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
