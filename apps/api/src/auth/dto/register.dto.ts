import { Locale } from '@subzero/shared';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  // ctx-security.md §1: email ≤ 254, имя ≤ 100.
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // IANA tz, NOT NULL по схеме customer'а — фронт берёт из браузера.
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  timezone!: string;

  @IsOptional()
  @IsInt()
  @IsIn([Locale.RU, Locale.EN])
  localeId?: number;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
