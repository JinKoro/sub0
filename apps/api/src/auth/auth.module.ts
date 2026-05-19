import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import {
  DrizzleCustomerRepository,
  DrizzleLoginAttemptRepository,
  DrizzleRefreshTokenRepository,
} from './auth.repositories';
import { AuthService } from './auth.service';
import { LockoutScheduler } from './lockout.scheduler';
import { LockoutService } from './lockout.service';
import { DrizzleRegistrationRepository } from './registration.repository';
import { DrizzleVerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtStrategy, JWT_PUBLIC_KEY } from './jwt.strategy';
import { Argon2PasswordHasher } from './password-hasher';
import { TOKEN_SERVICE } from './token.service';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [
    DrizzleCustomerRepository,
    DrizzleRefreshTokenRepository,
    DrizzleLoginAttemptRepository,
    DrizzleRegistrationRepository,
    DrizzleVerificationRepository,
    Argon2PasswordHasher,
    JwtStrategy,
    LockoutScheduler,
    {
      provide: LockoutService,
      useFactory: (attempts: DrizzleLoginAttemptRepository) => new LockoutService(attempts),
      inject: [DrizzleLoginAttemptRepository],
    },
    {
      provide: JWT_PUBLIC_KEY,
      useFactory: (c: ConfigService) => c.getOrThrow<string>('JWT_PUBLIC_KEY'),
      inject: [ConfigService],
    },
    {
      provide: TOKEN_SERVICE,
      useFactory: (c: ConfigService) =>
        new JwtTokenService({
          privateKey: c.getOrThrow<string>('JWT_PRIVATE_KEY'),
          publicKey: c.getOrThrow<string>('JWT_PUBLIC_KEY'),
          accessTtlSec: c.getOrThrow<number>('JWT_ACCESS_TTL_SEC'),
          refreshTtlSec: c.getOrThrow<number>('JWT_REFRESH_TTL_SEC'),
        }),
      inject: [ConfigService],
    },
    {
      provide: AuthService,
      useFactory: (
        customers: DrizzleCustomerRepository,
        refreshTokens: DrizzleRefreshTokenRepository,
        tokens: JwtTokenService,
        hasher: Argon2PasswordHasher,
        registration: DrizzleRegistrationRepository,
        lockout: LockoutService,
      ) => new AuthService(customers, refreshTokens, tokens, hasher, registration, lockout),
      inject: [
        DrizzleCustomerRepository,
        DrizzleRefreshTokenRepository,
        TOKEN_SERVICE,
        Argon2PasswordHasher,
        DrizzleRegistrationRepository,
        LockoutService,
      ],
    },
    {
      provide: VerificationService,
      useFactory: (
        repo: DrizzleVerificationRepository,
        refreshTokens: DrizzleRefreshTokenRepository,
        registration: DrizzleRegistrationRepository,
        tokens: JwtTokenService,
        hasher: Argon2PasswordHasher,
      ) => new VerificationService(repo, refreshTokens, registration, tokens, hasher),
      inject: [
        DrizzleVerificationRepository,
        DrizzleRefreshTokenRepository,
        DrizzleRegistrationRepository,
        TOKEN_SERVICE,
        Argon2PasswordHasher,
      ],
    },
  ],
})
export class AuthModule {}
