import { Module } from '@nestjs/common';

import { generateSku } from '../shared/sku';
import { DrizzleSubscriptionRepository } from './subscription.repository';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    DrizzleSubscriptionRepository,
    {
      provide: SubscriptionService,
      useFactory: (repo: DrizzleSubscriptionRepository) =>
        new SubscriptionService({
          repo,
          now: () => new Date(),
          generateSku: (p) => generateSku(p),
        }),
      inject: [DrizzleSubscriptionRepository],
    },
  ],
})
export class SubscriptionModule {}
