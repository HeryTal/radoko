import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message!: string;

  @IsBoolean()
  privacyConsent!: boolean;
}
