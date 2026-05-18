import { createHash, randomBytes } from 'node:crypto';

/**
 * Opaque verification token: the raw value goes in the email link, only its
 * sha256 is stored (verification_token.token_hash) — same scheme as refresh.
 */
export function createOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}
