\encoding UTF8
-- =============================================
-- Міграція: виправлення назв дисциплін
-- Запустити: psql "<connection-string>" -f render-db/fix-disciplines.sql
-- =============================================

-- Оновлення наявних дисциплін
UPDATE disciplines SET
  name        = 'Великий теніс',
  description = 'Лаун-теніс на відкритих і закритих кортах'
WHERE slug = 'tennis';

UPDATE disciplines SET
  name        = 'Греко-римська боротьба',
  description = 'Класична греко-римська боротьба'
WHERE slug = 'wrestling';

UPDATE disciplines SET
  name        = 'Бокс',
  description = 'Аматорський та професійний бокс'
WHERE slug = 'boxing';

UPDATE disciplines SET
  name        = 'Художня гімнастика',
  description = 'Художня та спортивна гімнастика'
WHERE slug = 'gymnastics';

UPDATE disciplines SET
  description = 'Футбол 11×11 та міні-футбол (футзал)'
WHERE slug = 'football';

UPDATE disciplines SET
  description = 'Баскетбол 5×5 та стрітбол 3×3'
WHERE slug = 'basketball';

UPDATE disciplines SET
  description = 'Класичний та пляжний волейбол'
WHERE slug = 'volleyball';

-- Нові дисципліни
INSERT INTO disciplines (name, slug, description, icon) VALUES
  ('Вільна боротьба',  'freestyle-wrestling', 'Спортивна вільна боротьба',         'icon-wrestling'),
  ('Настільний теніс', 'table-tennis',        'Настільний теніс (пінг-понг)',       'icon-table-tennis'),
  ('Міні-футбол',      'mini-football',       'Футзал — командний міні-футбол у залі', 'icon-football')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;

-- Виправлення міста адміністратора
UPDATE users SET city = 'Київ' WHERE email = 'admin@sportevent.ua' AND (city IS NULL OR city = '');

SELECT id, slug, name, description FROM disciplines ORDER BY id;
