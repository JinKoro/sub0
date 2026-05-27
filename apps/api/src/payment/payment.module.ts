import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller';
import { DrizzlePaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [
    DrizzlePaymentRepository,
    {
      provide: PaymentService,
      useFactory: (repo: DrizzlePaymentRepository) => new PaymentService(repo),
      inject: [DrizzlePaymentRepository],
    },
  ],
})
export class PaymentModule {}
