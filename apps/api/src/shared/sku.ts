import { randomBytes } from 'node:crypto';

// Crockford base32 — no I, L, O, U (ctx-business-logic.md §SKU).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 5 random bytes (40 bits) → 8 base32-crockford chars. */
function randomBody(): string {
  const bytes = randomBytes(5);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHABET[(value >>> bits) & 0x1f];
      value &= (1 << bits) - 1; // keep only the not-yet-emitted low bits (avoid 32-bit overflow)
    }
  }
  return out;
}

/** `<prefix>-<8 chars>` public id (ctx-architecture.md §2). */
export function generateSku(
  prefix: 'cus' | 'prj' | 'sub' | 'bil' | 'cct' | 'spm' | 'pay',
): string {
  return `${prefix}-${randomBody()}`;
}
