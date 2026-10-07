import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const cleanStrings = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @IsIn(['Médecin', 'Infirmier·ère', 'Sage-femme'])
  professionalType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  professionalTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  practiceCity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  practiceAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @Transform(cleanStrings)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  spokenLanguages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  bio?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears?: number | null;

  @Transform(cleanStrings)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  services?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000000)
  consultationFee?: number | null;

  @Transform(cleanStrings)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(['Cabinet', 'Téléphone', 'Téléconsultation'], { each: true })
  consultationModes?: string[];

  @IsOptional()
  @IsIn([15, 20, 30, 45, 60])
  consultationDurationMinutes?: number;
}
