import { generateSku } from './sku';

// Crockford base32 alphabet excludes I, L, O, U (ctx-business-logic §SKU).
const SKU_RE = /^prj-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/;

describe('generateSku', () => {
  it('produces <prefix>-<8 crockford-base32 chars>', () => {
    const sku = generateSku('prj');
    expect(sku).toMatch(SKU_RE);
    expect(sku).toHaveLength(12); // 3 prefix + dash + 8 — fits varchar(12)
  });

  it('never emits ambiguous letters I, L, O, U', () => {
    const body = Array.from({ length: 200 }, () => generateSku('prj').slice(4)).join('');
    expect(body).not.toMatch(/[ILOU]/);
  });

  it('is practically unique across many calls', () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateSku('prj')));
    expect(set.size).toBe(1000);
  });
});
