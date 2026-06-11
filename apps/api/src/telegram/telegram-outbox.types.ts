import type { UpcomingChargeTelegramContext } from './telegram-templates';

export interface TelegramOutboxRow {
  id: string;
  template: string;
  localeId: number;
  chatId: string;
  context: UpcomingChargeTelegramContext;
}

export interface TelegramOutboxRepository {
  /** Postgres advisory lock — один воркер на тик во всём кластере. */
  tryLock(): Promise<boolean>;
  unlock(): Promise<void>;
  listPending(limit: number): Promise<TelegramOutboxRow[]>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  deleteSentBefore(date: Date): Promise<void>;
}

export interface TelegramWorkerOptions {
  baseUrl: string;
  batchSize: number;
  retentionDays: number;
}
