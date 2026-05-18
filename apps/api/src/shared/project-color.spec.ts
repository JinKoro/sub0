import { randomProjectColor } from './project-color';

describe('randomProjectColor', () => {
  it('returns a 7-char #RRGGBB hex (fits project.color varchar(7))', () => {
    const c = randomProjectColor();
    expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(c).toHaveLength(7);
  });

  it('varies across calls', () => {
    const set = new Set(Array.from({ length: 50 }, () => randomProjectColor()));
    expect(set.size).toBeGreaterThan(1);
  });
});
