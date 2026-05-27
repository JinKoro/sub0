import { Module } from '@nestjs/common';

import { generateSku } from '../shared/sku';
import { MockPaymentProvider, PAYMENT_PROVIDER } from './payment-provider';
import { PaymentController } from './payment.controller';
import { DrizzlePaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [
    DrizzlePaymentRepository,
    { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider },
    {
      provide: PaymentService,
      useFactory: (repo: DrizzlePaymentRepository, provider: MockPaymentProvider) =>
        new PaymentService({
          repo,
          provider,
          now: () => new Date(),
          generateSku: () => generateSku('pay'),
        }),
      inject: [DrizzlePaymentRepository, PAYMENT_PROVIDER],
    },
  ],
})
export class PaymentModule {}
