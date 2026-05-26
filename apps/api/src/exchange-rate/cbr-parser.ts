/**
 * Парсер XML с https://www.cbr.ru/scripts/XML_daily.asp.
 *
 * Формат фиксированный, регэксп достаточно — добавлять fast-xml-parser ради одной
 * схемы не хочется. Кодировка XML — windows-1251, но нам нужны только CharCode
 * и Value (ASCII), поэтому декодировать не обязательно (Name'ы игнорируем).
 *
 * Курс в XML — это «сколько RUB за `Nominal` единиц валюты». Нормализуем к 1 единице:
 * `rate = Value / Nominal`.
 */
export interface CbrRate {
  charCode: string;
  /** RUB за 1 единицу валюты. */
  rate: number;
}

export interface CbrParseResult {
  sourceAt: Date;
  rates: CbrRate[];
}

const DATE_RE = /<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/;
const VALUTE_RE = /<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g;
const CHAR_CODE_RE = /<CharCode>([A-Z]{3})<\/CharCode>/;
const NOMINAL_RE = /<Nominal>(\d+)<\/Nominal>/;
const VALUE_RE = /<Value>([\d,.]+)<\/Value>/;

export function parseCbrXml(xml: string): CbrParseResult {
  const dateM = DATE_RE.exec(xml);
  if (!dateM) throw new Error('CBR XML: ValCurs Date attribute not found');
  const [, dd, mm, yyyy] = dateM;
  const sourceAt = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));

  const rates: CbrRate[] = [];
  for (const match of xml.matchAll(VALUTE_RE)) {
    const body = match[1]!;
    const charCode = CHAR_CODE_RE.exec(body)?.[1];
    const nominalStr = NOMINAL_RE.exec(body)?.[1];
    const valueStr = VALUE_RE.exec(body)?.[1];
    if (!charCode || !nominalStr || !valueStr) continue;
    const nominal = Number(nominalStr);
    const value = Number(valueStr.replace(',', '.'));
    if (!Number.isFinite(nominal) || nominal <= 0 || !Number.isFinite(value) || value <= 0) {
      continue;
    }
    rates.push({ charCode, rate: value / nominal });
  }
  return { sourceAt, rates };
}
