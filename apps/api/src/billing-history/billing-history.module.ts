import { Module } from '@nestjs/common';

import { BillingHistoryController } from './billing-history.controller';
import { DrizzleBillingHistoryRepository } from './billing-history.repository';
import { BillingHistoryService } from './billing-history.service';

@Module({
  controllers: [BillingHistoryController],
  providers: [
    DrizzleBillingHistoryRepository,
    {
      provide: BillingHistoryService,
      useFactory: (repo: DrizzleBillingHistoryRepository) => new BillingHistoryService(repo),
      inject: [DrizzleBillingHistoryRepository],
    },
  ],
})
export class BillingHistoryModule {}
