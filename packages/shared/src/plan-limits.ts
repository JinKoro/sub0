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
