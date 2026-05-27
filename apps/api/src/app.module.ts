import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { BillingNotificationModule } from './billing-notification/billing-notification.module';
import { BillingHistoryModule } from './billing-history/billing-history.module';
import { CategoryModule } from './category/category.module';
import { ServiceModule } from './service/service.module';
import { validateEnv } from './config/env.schema';
import { CustomerModule } from './customer/customer.module';
import { DbModule } from './db/db.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { PaymentModule } from './payment/payment.module';
import { ProjectModule } from './project/project.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    DbModule,
    HealthModule,
    AuthModule,
    CustomerModule,
    MailModule,
    ProjectModule,
    CategoryModule,
    ServiceModule,
    SubscriptionModule,
    BillingHistoryModule,
    ExchangeRateModule,
    BillingNotificationModule,
    PaymentModule,
  ],
})
export class AppModule {}
