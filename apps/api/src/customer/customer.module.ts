import { Module } from '@nestjs/common';

import { CustomerController } from './customer.controller';
import { DrizzleCustomerProfileRepository } from './customer.repository';
import { CustomerScheduler } from './customer.scheduler';
import { CustomerService } from './customer.service';
import { DrizzleRefreshTokenRepository } from '../auth/auth.repositories';
import { Argon2PasswordHasher } from '../auth/password-hasher';

@Module({
  controllers: [CustomerController],
  providers: [
    DrizzleCustomerProfileRepository,
    DrizzleRefreshTokenRepository,
    Argon2PasswordHasher,
    CustomerScheduler,
    {
      provide: CustomerService,
      useFactory: (
        repo: DrizzleCustomerProfileRepository,
        refreshTokens: DrizzleRefreshTokenRepository,
        hasher: Argon2PasswordHasher,
      ) => new CustomerService(repo, refreshTokens, hasher),
      inject: [DrizzleCustomerProfileRepository, DrizzleRefreshTokenRepository, Argon2PasswordHasher],
    },
  ],
})
export class CustomerModule {}
