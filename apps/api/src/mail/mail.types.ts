import type { MailContext } from './mail-templates';

export interface MailOutboxRow {
  id: string;
  template: string;
  localeId: number;
  toEmail: string;
  context: MailContext;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailSender {
  send(msg: MailMessage): Promise<void>;
}

export interface MailOutboxRepository {
  /** Postgres advisory lock — only one worker processes a tick cluster-wide. */
  tryLock(): Promise<boolean>;
  unlock(): Promise<void>;
  listPending(limit: number): Promise<MailOutboxRow[]>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  deleteSentBefore(date: Date): Promise<void>;
}

export interface MailWorkerOptions {
  baseUrl: string;
  batchSize: number;
  retentionDays: number;
}
