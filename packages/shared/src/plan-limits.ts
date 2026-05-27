/** Free-тариф: лимит на количество не-архивных подписок (roadmap §«Фримиум»).
 *  В счёт идут ACTIVE / PAUSED / CANCELLED. ARCHIVED и soft-deleted — не считаем. */
export const FREE_TIER_SUBSCRIPTION_LIMIT = 5;

/** Код ошибки, возвращаемый API при попытке превысить лимит подписок Free.
 *  Фронт ловит его и рисует дружелюбный баннер. */
export const FREE_TIER_LIMIT_ERROR = 'free_tier_limit_reached';

/** Free-тариф: лимит на количество активных (не-soft-deleted) проектов. */
export const FREE_TIER_PROJECT_LIMIT = 1;

/** Код ошибки при попытке превысить лимит проектов Free. */
export const FREE_TIER_PROJECT_LIMIT_ERROR = 'free_tier_project_limit_reached';

/** Цены тарифа Pro (валюта — RUB). Совпадают с UI на /pricing и
 *  Settings → Billing → UpgradePlanPage. Источник истины для бэка
 *  (при mock-апгрейде) и фронта (для подписи кнопки).
 *
 *  Когда появится реальный провайдер — цены переедут в админку /
 *  promo-таблицу, и эти константы станут дефолтом. */
export const PRO_MONTHLY_PRICE_RUB = '290.00';
export const PRO_YEARLY_PRICE_RUB = '2900.00';
