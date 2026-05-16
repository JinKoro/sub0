export interface Review {
  /** Текст отзыва. Для seed — пара { ru, en }, для пользовательских — одна строка. */
  quote: string | { ru: string; en: string };
  name: string;
  role: string | { ru: string; en: string };
  /** Первый символ имени, ставится в LogoPill. */
  init: string;
  /** HEX из SUB0-палитры. */
  color: string;
  /** Дата публикации в человекочитаемом виде. Для seed — { ru, en }. */
  date: string | { ru: string; en: string };
  /** Локально отправленный, ожидает модерации. */
  pending?: boolean;
}
