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
  Min,
  ValidateNested,
} from 'class-validator';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const STATES = [
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
];

// Один тип promo — поля опциональны; сервис различает create/update пути по наличию sku.
class PromoInDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  amount?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}

export class UpdateSubscriptionDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectSku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceSku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iconCustom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categorySku?: string;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  amount?: string;

  @IsOptional()
  @IsInt()
  @IsIn([Currency.RUB, Currency.USD, Currency.EUR, Currency.BYN])
  currencyId?: Currency;

  @IsOptional()
  @IsInt()
  @IsIn([BillingPeriod.MONTH, BillingPeriod.YEAR])
  billingPeriodId?: BillingPeriod;

  @IsOptional()
  @IsISO8601()
  firstBillingDate?: string;

  @IsOptional()
  @IsISO8601()
  nextBillingDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isTrial?: boolean;

  @IsOptional()
  @IsISO8601()
  trialEndsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;

  @IsOptional()
  @IsInt()
  @IsIn(STATES)
  stateId?: SubscriptionState;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromoInDto)
  promos?: PromoInDto[];
}
