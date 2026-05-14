export type CabinetSubStatus = 'active' | 'paused' | 'cancel' | 'archive';
export type CabinetSubCycle = 'monthly' | 'yearly';
export type CabinetCurrency = 'RUB' | 'USD' | 'EUR' | 'BYN';

export interface CabinetSubscription {
  id: number;
  name: string;
  char: string;
  project: string;
  cat: string;
  cycle: CabinetSubCycle;
  trial: boolean;
  promo?: boolean;
  promoEndsDay?: number;
  promoEndsMonth?: number;
  nextDay: number;
  nextMonth: number;
  price: number;
  cur: CabinetCurrency;
  status: CabinetSubStatus;
  color: string | null;
  note: string;
}

export interface SubCategory {
  id: string;
  name: string;
  nameEn: string;
  color: string;
}
