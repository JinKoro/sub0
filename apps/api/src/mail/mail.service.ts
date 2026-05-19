import { Inject, Injectable } from '@nestjs/common';
import type { Transporter } from 'nodemailer';

import type { MailMessage, MailSender } from './mail.types';

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
export const MAIL_FROM = Symbol('MAIL_FROM');

@Injectable()
export class MailService implements MailSender {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: Transporter,
    @Inject(MAIL_FROM) private readonly from: string,
  ) {}

  async send(msg: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
  }
}
