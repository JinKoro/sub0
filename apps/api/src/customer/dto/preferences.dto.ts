import { Currency, Locale } from '@subzero/shared';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Region & format card on Settings → Account (one save = one request). */
export class PreferencesDto {
  @IsOptional()
  @IsInt()
  @IsIn([Locale.RU, Locale.EN])
  localeId?: number;

  // IANA tz string; same bound as RegisterDto.
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsInt()
  @IsIn([Currency.RUB, Currency.USD, Currency.EUR, Currency.BYN])
  currencyId?: number;

  @IsInt()
  @Min(1)
  version!: number;
}
