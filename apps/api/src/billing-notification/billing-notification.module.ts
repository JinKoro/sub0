import { Module } from '@nestjs/common';

import { DrizzleBillingNotificationRepository } from './billing-notification.repository';
import { BillingNotificationScheduler } from './billing-notification.scheduler';
import { BillingNotificationService } from './billing-notification.service';

@Module({
  providers: [
    DrizzleBillingNotificationRepository,
    {
      provide: BillingNotificationService,
      useFactory: (repo: DrizzleBillingNotificationRepository) =>
        new BillingNotificationService({ repo, now: () => new Date() }),
      inject: [DrizzleBillingNotificationRepository],
    },
    BillingNotificationScheduler,
  ],
  exports: [BillingNotificationService],
})
export class BillingNotificationModule {}
