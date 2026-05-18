import { hash, verify } from '@node-rs/argon2';

/** argon2id with OWASP-recommended params (ctx-security.md §2: m=64MB, t=3, p=1). */
const ARGON2_OPTS = { memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hashStr: string, plain: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, ARGON2_OPTS);
  }

  verify(hashStr: string, plain: string): Promise<boolean> {
    return verify(hashStr, plain, ARGON2_OPTS);
  }
}
