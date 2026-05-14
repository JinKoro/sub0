import type { CabinetCurrency, CabinetSubCycle, CabinetSubStatus } from '@/entities/subscription/model/cabinet-types';

export interface PromoInput {
  price: string;
  ends: string;
}

export interface SubscriptionFormInitial {
  id?: number;
  name?: string;
  char?: string;
  color?: string;
  cat?: string;
  project?: string;
  price?: number | string;
  cur?: CabinetCurrency;
  cycle?: CabinetSubCycle;
  nextDate?: string;
  status?: CabinetSubStatus;
  note?: string;
  trial?: boolean;
  trialEnds?: string;
  promos?: PromoInput[];
  promo?: boolean;
  promoPrice?: number | string;
  promoEnds?: string;
}
