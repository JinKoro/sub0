import { renderTelegram } from './telegram-templates';
import type { TelegramSender } from './telegram.client';
import type {
  TelegramOutboxRepository,
  TelegramOutboxRow,
  TelegramWorkerOptions,
} from './telegram-outbox.types';

const DAY_MS = 86_400_000;

/**
 * Framework-agnostic core доставки в Telegram. Зеркалит MailOutboxWorker:
 * один тик на кластер через advisory lock (AGENTS §Архитектура —
 * идемпотентный cron, без double-run). Шедулинг навешивается в провайдере.
 */
export class TelegramOutboxWorker {
  constructor(
    private readonly repo: TelegramOutboxRepository,
    private readonly sender: TelegramSender,
    private readonly opts: TelegramWorkerOptions,
  ) {}

  async tick(): Promise<void> {
    if (!(await this.repo.tryLock())) return;
    try {
      const rows = await this.repo.listPending(this.opts.batchSize);
      for (const row of rows) {
        await this.processOne(row);
      }
    } catch {
      // Transient listing failure — next tick retries; lock freed in finally.
    } finally {
      await this.repo.unlock();
    }
  }

  private async processOne(row: TelegramOutboxRow): Promise<void> {
    try {
      const text = renderTelegram(row.template, row.localeId, row.context, this.opts.baseUrl);
      await this.sender.sendMessage(row.chatId, text);
      await this.repo.markSent(row.id);
    } catch (e) {
      await this.repo.markFailed(row.id, e instanceof Error ? e.message : String(e));
    }
  }

  async runRetention(): Promise<void> {
    await this.repo.deleteSentBefore(new Date(Date.now() - this.opts.retentionDays * DAY_MS));
  }
}
