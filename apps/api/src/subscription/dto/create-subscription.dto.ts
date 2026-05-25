import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BillingPeriod, Currency } from '@subzero/shared';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const CURRENCIES = [Currency.RUB, Currency.USD, Currency.EUR, Currency.BYN];
const PERIODS = [BillingPeriod.MONTH, BillingPeriod.YEAR];

class NewPromoInDto {
  @IsString()
  @Matches(AMOUNT_RE)
  amount!: string;

  @IsISO8601()
  endsAt!: string;
}

export class CreateSubscriptionDto {
  @IsString()
  @MaxLength(64)
  projectSku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceSku?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nameCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iconCustom?: string | null;

  @IsString()
  @MaxLength(64)
  categorySku!: string;

  @IsString()
  @Matches(AMOUNT_RE, { message: 'amount must be a decimal with ≤2 fractional digits' })
  amount!: string;

  @IsInt()
  @IsIn(CURRENCIES)
  currencyId!: Currency;

  @IsInt()
  @IsIn(PERIODS)
  billingPeriodId!: BillingPeriod;

  @IsISO8601()
  firstBillingDate!: string;

  @IsOptional()
  @IsISO8601()
  nextBillingDate?: string | null;

  @IsBoolean()
  isTrial!: boolean;

  @IsOptional()
  @IsISO8601()
  trialEndsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewPromoInDto)
  promos?: NewPromoInDto[];
}
