import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const STATES = [
  SubscriptionState.ACTIVE,
  SubscriptionState.PAUSED,
  SubscriptionState.CANCELLED,
];

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
  @IsBoolean()
  isTrial?: boolean;

  @IsOptional()
  @IsString()
  @Matches(AMOUNT_RE)
  promoAmount?: string | null;

  @IsOptional()
  @IsISO8601()
  promoEndsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string | null;

  @IsOptional()
  @IsInt()
  @IsIn(STATES)
  stateId?: SubscriptionState;
}
