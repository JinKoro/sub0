-- Перенос существующих одиночных промо в subscription_promo.
-- Старые колонки promo_amount/promo_ends_at пока остаются (expand) —
-- drop отдельной миграцией в будущем PR.
-- SKU генерируем через md5 от рандома; вероятность коллизии в backfill
-- ничтожна, плюс есть NOT EXISTS guard от повторного запуска.
INSERT INTO subscription_promo (sku, subscription_id, amount, ends_at)
SELECT
  'spm-' || substr(md5(random()::text || s.id::text), 1, 8),
  s.id,
  s.promo_amount,
  s.promo_ends_at
FROM subscription s
WHERE s.promo_amount IS NOT NULL
  AND s.promo_ends_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscription_promo p
    WHERE p.subscription_id = s.id AND p.deleted_at IS NULL
  );
