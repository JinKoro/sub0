import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCbrXml } from './cbr-parser';

const SAMPLE = readFileSync(join(__dirname, '__fixtures__', 'cbr-sample.xml'), 'utf8');

describe('parseCbrXml', () => {
  it('извлекает sourceAt из атрибута ValCurs Date', () => {
    const { sourceAt } = parseCbrXml(SAMPLE);
    expect(sourceAt.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('USD/EUR/BYN — rate = value (nominal=1)', () => {
    const { rates } = parseCbrXml(SAMPLE);
    const byCode = Object.fromEntries(rates.map((r) => [r.charCode, r.rate]));
    expect(byCode.USD).toBeCloseTo(78.5031, 4);
    expect(byCode.EUR).toBeCloseTo(91.1234, 4);
    expect(byCode.BYN).toBeCloseTo(27.85, 4);
  });

  it('нормализует к 1 единице для валют с Nominal > 1 (JPY: 100 → 1)', () => {
    const { rates } = parseCbrXml(SAMPLE);
    const jpy = rates.find((r) => r.charCode === 'JPY')!;
    expect(jpy.rate).toBeCloseTo(0.504321, 6);
  });

  it('бросает при отсутствии Date', () => {
    expect(() => parseCbrXml('<ValCurs name="x"></ValCurs>')).toThrow(/Date attribute/);
  });

  it('пропускает Valute без CharCode/Value/Nominal без падения', () => {
    const broken = `<?xml version="1.0"?>
<ValCurs Date="01.06.2026">
  <Valute><CharCode>USD</CharCode></Valute>
  <Valute><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>91,12</Value></Valute>
</ValCurs>`;
    const { rates } = parseCbrXml(broken);
    expect(rates).toHaveLength(1);
    expect(rates[0]!.charCode).toBe('EUR');
  });
});
