import { Module } from '@nestjs/common';

import { generateSku } from '../shared/sku';
import { DrizzleSubscriptionRepository } from './subscription.repository';
import { DrizzleSubscriptionPromoRepository } from './subscription-promo.repository';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    DrizzleSubscriptionRepository,
    DrizzleSubscriptionPromoRepository,
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
  ],
})
export class SubscriptionModule {}
