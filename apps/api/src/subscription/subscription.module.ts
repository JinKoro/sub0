import { Module } from '@nestjs/common';

import { generateSku } from '../shared/sku';
import { DrizzleSubscriptionRepository } from './subscription.repository';
import { DrizzleSubscriptionPromoRepository } from './subscription-promo.repository';
import { DrizzleSubscriptionCycleRepository } from './subscription-cycle.repository';
import { SubscriptionCycleService } from './subscription-cycle.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionScheduler } from './subscription.scheduler';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    DrizzleSubscriptionRepository,
    DrizzleSubscriptionPromoRepository,
    DrizzleSubscriptionCycleRepository,
    SubscriptionScheduler,
    {
      provide: SubscriptionService,
      useFactory: (
        repo: DrizzleSubscriptionRepository,
        promoRepo: DrizzleSubscriptionPromoRepository,
      ) =>
        new SubscriptionService({
          repo,
          promoRepo,
          now: () => new Date(),
          generateSku,
        }),
      inject: [DrizzleSubscriptionRepository, DrizzleSubscriptionPromoRepository],
    },
    {
      provide: SubscriptionCycleService,
      useFactory: (repo: DrizzleSubscriptionCycleRepository) =>
        new SubscriptionCycleService({
          repo,
          now: () => new Date(),
          generateBilSku: () => generateSku('bil'),
        }),
      inject: [DrizzleSubscriptionCycleRepository],
    },
  ],
})
export class SubscriptionModule {}
