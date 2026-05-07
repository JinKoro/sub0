-- Seed: 10 системных категорий. Идемпотентно: повторный запуск
-- обновляет существующие записи по sku, не создаёт дубликатов.
INSERT INTO "category" ("sku", "name_ru", "name_en", "color") VALUES
  ('N9095NFS', 'Видео',                    'Video',            '#c94a1c'),
  ('BPBXYE18', 'Музыка',                   'Music',            '#6b21d9'),
  ('F10MPC5T', 'Образование',              'Education',        '#1347ff'),
  ('E7ED6796', 'Спорт и здоровье',         'Health & Fitness', '#0a7a3f'),
  ('F6V8SZ0S', 'Программное обеспечение',  'Software',         '#4a5a7a'),
  ('W6Y66ZRF', 'Продуктивность',           'Productivity',     '#b0851a'),
  ('Y4PB344K', 'Игры',                     'Games',            '#8a2c4a'),
  ('5S0R9DSF', 'ИИ-инструменты',           'AI Tools',         '#2d6b6b'),
  ('5XVMJ5G6', 'Хранилища',                'Storage',          '#6b6b66'),
  ('SSRFX6JE', 'Другое',                   'Other',            '#7a6f5a')
ON CONFLICT ("sku") DO UPDATE SET
  "name_ru" = EXCLUDED."name_ru",
  "name_en" = EXCLUDED."name_en",
  "color"   = EXCLUDED."color";
