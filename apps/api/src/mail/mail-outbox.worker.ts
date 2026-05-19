import { renderMail } from './mail-templates';
import type {
  MailOutboxRepository,
  MailOutboxRow,
  MailSender,
  MailWorkerOptions,
} from './mail.types';

const DAY_MS = 86_400_000;

/**
 * Framework-agnostic core. Scheduling (@Interval / @Cron) is attached in the
 * Nest provider (mail.module). One tick at a time cluster-wide via the
 * advisory lock — AGENTS.md §Архитектура (idempotent cron, no double-run).
 */
export class MailOutboxWorker {
  constructor(
    private readonly repo: MailOutboxRepository,
    private readonly mail: MailSender,
    private readonly opts: MailWorkerOptions,
  ) {}

  async tick(): Promise<void> {
    if (!(await this.repo.tryLock())) {
      return;
    }
    try {
      const rows = await this.repo.listPending(this.opts.batchSize);
      for (const row of rows) {
        await this.processOne(row);
      }
    } catch {
      // Listing/transient failure — next tick retries; lock freed in finally.
    } finally {
      await this.repo.unlock();
    }
  }

  private async processOne(row: MailOutboxRow): Promise<void> {
    try {
      const m = renderMail(row.template, row.localeId, row.context, this.opts.baseUrl);
      await this.mail.send({ to: row.toEmail, subject: m.subject, html: m.html, text: m.text });
      await this.repo.markSent(row.id);
    } catch (e) {
      await this.repo.markFailed(row.id, e instanceof Error ? e.message : String(e));
    }
  }

  async runRetention(): Promise<void> {
    await this.repo.deleteSentBefore(new Date(Date.now() - this.opts.retentionDays * DAY_MS));
  }
}
