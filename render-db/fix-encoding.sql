-- =============================================
-- fix-encoding.sql
-- Виправлення кодування даних після неправильного імпорту
-- Запускати: psql "connection-string" -f render-db/fix-encoding.sql
-- =============================================
\encoding UTF8

-- =============================================
-- DISCIPLINES — виправлення назв та описів
-- =============================================
UPDATE disciplines SET name='Легка атлетика', description='Біг, стрибки, метання'          WHERE slug='athletics';
UPDATE disciplines SET name='Плавання',       description='Спортивне плавання'              WHERE slug='swimming';
UPDATE disciplines SET name='Футбол',         description='Ігровий вид спорту'             WHERE slug='football';
UPDATE disciplines SET name='Баскетбол',      description='Ігровий вид спорту'             WHERE slug='basketball';
UPDATE disciplines SET name='Волейбол',       description='Ігровий вид спорту'             WHERE slug='volleyball';
UPDATE disciplines SET name='Теніс',          description='Великий теніс'                  WHERE slug='tennis';
UPDATE disciplines SET name='Борьба',         description='Вільна та греко-римська боротьба' WHERE slug='wrestling';
UPDATE disciplines SET name='Боксинг',        description='Аматорський і профресійний боксинг' WHERE slug='boxing';
UPDATE disciplines SET name='Велоспорт',      description='Шосейний та трековий велоспорт' WHERE slug='cycling';
UPDATE disciplines SET name='Гімнастика',     description='Художня та спортивна гімнастика' WHERE slug='gymnastics';

-- =============================================
-- ROLES — виправлення описів
-- =============================================
UPDATE roles SET description='Адміністратор системи' WHERE name='admin';
UPDATE roles SET description='Спортсмен'             WHERE name='athlete';
UPDATE roles SET description='Представник команди'   WHERE name='team';
UPDATE roles SET description='Відвідувач'            WHERE name='visitor';

-- =============================================
-- LOCATIONS — виправлення назв міст і адрес
-- =============================================
UPDATE locations SET
  name    = 'НСК Олімпійський',
  address = 'вул. Велика Васильківська, 55',
  city    = 'Київ'
WHERE id = 1;

UPDATE locations SET
  name    = 'Палац спорту',
  address = 'пл. Спортивна, 1',
  city    = 'Київ'
WHERE id = 2;

UPDATE locations SET
  name    = 'Стадіон Металіст',
  address = 'вул. Плехановська, 66',
  city    = 'Харків'
WHERE id = 3;

UPDATE locations SET
  name    = 'Арена Львів',
  address = 'вул. Стрийська, 199',
  city    = 'Львів'
WHERE id = 4;

-- =============================================
-- USERS — адмін
-- =============================================
UPDATE users SET
  first_name = 'Адміністратор',
  last_name  = 'Системи'
WHERE email = 'admin@sportevent.ua';

-- =============================================
-- PARTNERS
-- =============================================
UPDATE partners SET name='Міністерство молоді та спорту', description='Державний партнер'  WHERE sort_order=1;
UPDATE partners SET name='Олімпійський комітет України',  description='Офіційний партнер'  WHERE sort_order=2;
UPDATE partners SET name='SportLife',  description='Генеральний спонсор' WHERE sort_order=3;
UPDATE partners SET name='Nike Ukraine', description='Спонсор форми'     WHERE sort_order=4;
UPDATE partners SET name='Sport UA',   description='Медіапартнер'        WHERE sort_order=5;

-- =============================================
-- FAQ
-- =============================================
UPDATE faq SET
  question = 'Як зареєструватися на змагання?',
  answer   = 'Для реєстрації необхідно створити обліковий запис на сайті, увійти в особистий кабінет та подати заявку на бажаний захід.'
WHERE sort_order = 1;

UPDATE faq SET
  question = 'Які документи потрібні для участі?',
  answer   = 'Зазвичай потрібні паспорт або інший документ, що посвідчує особу, медична довідка та страховий поліс.'
WHERE sort_order = 2;

UPDATE faq SET
  question = 'Як дізнатися результати змагань?',
  answer   = 'Результати публікуються на сторінці відповідного заходу після його завершення.'
WHERE sort_order = 3;

UPDATE faq SET
  question = 'Як скасувати реєстрацію?',
  answer   = 'Скасувати реєстрацію можна в особистому кабінеті у розділі "Мої заявки".'
WHERE sort_order = 4;

UPDATE faq SET
  question = 'Де знайти регламент змагань?',
  answer   = 'Регламент кожного заходу розміщений на його сторінці у розділі "Правила та регламент".'
WHERE sort_order = 5;

UPDATE faq SET
  question = 'Як зв''язатися з організаторами?',
  answer   = 'Зв''язатися з організаторами можна через форму зворотного зв''язку на сторінці "Контакти".'
WHERE sort_order = 6;

-- Перевірка результату
SELECT 'disciplines' as "table", count(*) as "rows" FROM disciplines
UNION ALL
SELECT 'locations', count(*) FROM locations
UNION ALL
SELECT 'roles', count(*) FROM roles
UNION ALL
SELECT 'users', count(*) FROM users
UNION ALL
SELECT 'events', count(*) FROM events
UNION ALL
SELECT 'news', count(*) FROM news;

SELECT id, name, slug FROM disciplines ORDER BY id;
