-- =============================================
-- seed.pg.sql — Тестові дані для Render PostgreSQL
-- Запускати ПІСЛЯ fix-encoding.sql
-- psql "connection-string" -f render-db/seed.pg.sql
-- =============================================
\encoding UTF8

-- =============================================
-- TEST USERS (password: Test@2025)
-- hash generated: bcrypt $2b$10$...
-- =============================================
INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, birth_date, city, is_active, email_verified) VALUES
  (2, 'kovalenko@test.ua', '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Олексій',    'Коваленко', '+380501234567', '2000-05-15', 'Київ',   TRUE, TRUE),
  (2, 'petrenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Марія',      'Петренко',  '+380671234568', '1998-08-22', 'Харків', TRUE, TRUE),
  (2, 'bondar@test.ua',    '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Дмитро',     'Бондар',    '+380931234569', '2002-03-10', 'Львів',  TRUE, TRUE),
  (2, 'lysenko@test.ua',   '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Ірина',      'Лисенко',   '+380961234570', '1999-11-30', 'Одеса',  TRUE, TRUE),
  (2, 'savchenko@test.ua', '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Андрій',     'Савченко',  '+380731234571', '2001-07-08', 'Київ',   TRUE, TRUE),
  (3, 'dynamo@test.ua',    '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Команда',    'Динамо',    '+380441234572', '1990-01-01', 'Київ',   TRUE, TRUE),
  (2, 'moroz@test.ua',     '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Тетяна',     'Мороз',     '+380501234573', '2003-02-14', 'Дніпро', TRUE, TRUE),
  (2, 'shevchuk@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Василь',     'Шевчук',    '+380671234574', '1997-09-25', 'Харків', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- EVENTS
-- discipline IDs: 1=athletics 2=swimming 3=football 4=basketball
--                 5=volleyball 6=tennis 7=wrestling 8=boxing
--                 9=cycling 10=gymnastics
-- location IDs: 1=НСК(Київ) 2=Палац спорту(Київ) 3=Металіст(Харків) 4=Арена Львів
-- created_by=1 (admin)
-- =============================================

INSERT INTO events
  (discipline_id, location_id, created_by, title, slug,
   description, start_date, end_date, registration_deadline,
   max_participants, entry_fee, status, is_featured)
VALUES
  -- ── ЗАВЕРШЕНІ (2 штуки) ───────────────────────────────────────────────
  (8, 2, 1,
   'Зимовий кубок з боксу 2026',
   'zymovyi-kubok-boksu-2026',
   'Відкритий турнір з любительського боксу серед юніорів та дорослих. Вагові категорії від 49 до 91 кг.',
   '2026-02-14 10:00:00', '2026-02-15 18:00:00', '2026-02-10 23:59:59',
   64, 300.00, 'completed', TRUE),

  (5, 3, 1,
   'Харківська зимова волейбольна ліга',
   'kharkiv-zymova-volejbolna-liha',
   'Турнір з волейболу серед аматорських команд Харківського регіону.',
   '2026-02-21 09:00:00', '2026-02-22 17:00:00', '2026-02-18 23:59:59',
   24, 500.00, 'completed', FALSE),

  -- ── РЕЄСТРАЦІЯ ВІДКРИТА ───────────────────────────────────────────────
  (1, 1, 1,
   'Весняний легкоатлетичний марафон',
   'vesnianyi-lehkoatletychnyi-marafon',
   'Традиційний весняний марафон Києва — 42 км по вулицях столиці. Дистанції: 5 км, 10 км, 21 км, 42 км.',
   '2026-04-12 08:00:00', '2026-04-12 18:00:00', '2026-04-05 23:59:59',
   500, 150.00, 'registration_open', TRUE),

  (8, 2, 1,
   'Відкритий чемпіонат Києва з боксу',
   'vidkrytyi-chempionat-kyieva-boksu',
   'Змагання серед аматорів у всіх вагових категоріях. Запрошуються спортсмени від 18 до 35 років.',
   '2026-04-25 10:00:00', '2026-04-26 19:00:00', '2026-04-20 23:59:59',
   128, 400.00, 'registration_open', FALSE),

  (2, 2, 1,
   'Кубок України з плавання',
   'kubok-ukrainy-plavannia',
   'Офіційні змагання з плавання у закритому 50-метровому басейні. Дистанції від 50 до 1500 м.',
   '2026-05-10 09:00:00', '2026-05-11 17:00:00', '2026-05-03 23:59:59',
   200, 250.00, 'registration_open', TRUE),

  (3, 1, 1,
   'Літній футбольний турнір «Кубок СпортUA»',
   'litnii-futbolnyi-turнір-kubok-sportua',
   'Командний турнір з міні-футболу. Групова стадія, чвертьфінали, фінал. Команди по 5-7 гравців.',
   '2026-06-06 10:00:00', '2026-06-07 19:00:00', '2026-06-01 23:59:59',
   32, 1200.00, 'registration_open', FALSE),

  -- ── ЗАПЛАНОВАНІ (upcoming) ────────────────────────────────────────────
  (4, 1, 1,
   'Чемпіонат Київської області з баскетболу',
   'chempionat-kyivskoi-oblasti-basketbol',
   'Офіційний чемпіонат серед чоловічих та жіночих команд Київської області.',
   '2026-07-18 10:00:00', '2026-07-19 18:00:00', '2026-07-12 23:59:59',
   16, 800.00, 'upcoming', FALSE),

  (10, 2, 1,
   'Відкритий турнір з художньої гімнастики',
   'vidkrytyi-turнір-khudozhnoi-himnastyky',
   'Змагання для дівчат 8–18 років у групових та індивідуальних програмах.',
   '2026-08-08 09:00:00', '2026-08-09 17:00:00', '2026-07-31 23:59:59',
   80, 200.00, 'upcoming', TRUE),

  (9, 4, 1,
   'Велоперегони «Тур Карпат» 2026',
   'veloperehony-tur-karpat-2026',
   'Шосейна гонка у Карпатах: три етапи по 80–120 км. Класи: еліта, аматори, ветерани.',
   '2026-09-05 07:00:00', '2026-09-07 18:00:00', '2026-08-25 23:59:59',
   150, 500.00, 'upcoming', TRUE),

  (7, 3, 1,
   'Чемпіонат Харкова з боротьби',
   'chempionat-kharkova-borotba',
   'Вільна та греко-римська боротьба серед юнаків та дорослих у всіх вагових категоріях.',
   '2026-10-03 10:00:00', '2026-10-04 17:00:00', '2026-09-25 23:59:59',
   96, 350.00, 'upcoming', FALSE),

  (6, 2, 1,
   'Відкритий тенісний турнір «Осінній кубок»',
   'vidkrytyi-tenisny-turнір-osinniy-kubok',
   'Турнір з великого тенісу, одиночний та парний розряди. Покриття: тверде.',
   '2026-10-17 09:00:00', '2026-10-18 18:00:00', '2026-10-10 23:59:59',
   64, 400.00, 'upcoming', FALSE),

  (1, 4, 1,
   'Осінній легкоатлетичний пробіг Львовом',
   'osinnii-lehkoatletychnyi-probih-lvovom',
   'Масовий забіг по вулицях Львова. Дистанції: 3 км, 6 км, 12 км. Учасники від 14 років.',
   '2026-10-25 09:00:00', '2026-10-25 14:00:00', '2026-10-18 23:59:59',
   800, 100.00, 'upcoming', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- NEWS (5 статей, author=1 адмін)
-- =============================================
INSERT INTO news (author_id, title, slug, excerpt, content, category, status, views) VALUES
  (1,
   'СпортUA запускає новий сезон реєстрацій 2026',
   'sportua-zapuskaie-novyi-sezon-2026',
   'Відкрито реєстрацію на весняні та літні змагання 2026 року.',
   'Ми раді повідомити про старт реєстрацій на весняно-літній спортивний сезон 2026 року. На порталі вже відкрито понад 10 заходів у різних дисциплінах — від легкої атлетики до боксу та плавання. Реєструйтесь та готуйтесь до змагань!',
   'announcement', 'published', 312),

  (1,
   'Результати Зимового кубка з боксу 2026',
   'rezultaty-zymovoho-kubka-boksu-2026',
   'Підсумки дводенного турніру: переможці та призери у кожній ваговій категорії.',
   'Завершився Зимовий кубок з боксу 2026. Турнір зібрав 64 учасники з 12 міст України. Змагання тривали два дні та показали високий рівень підготовки спортсменів. Вітаємо переможців та призерів!',
   'news', 'published', 489),

  (1,
   'Як підготуватися до марафону: поради тренерів',
   'iak-pidhotuvatysia-do-marafonu',
   'Практичні рекомендації від досвідчених тренерів щодо підготовки до бігу на довгі дистанції.',
   'Весняний сезон — відмінний час розпочати підготовку до марафону. Наші тренери зібрали ключові поради: правильне харчування, план тренувань, вибір взуття та психологічна підготовка. Читайте та готуйтесь до Весняного марафону 12 квітня!',
   'blog', 'published', 756),

  (1,
   'Харківська волейбольна ліга: підсумки зимового сезону',
   'kharkiv-volejbol-pidsumky-zymы',
   'Харківська аматорська ліга завершила зимовий сезон. Дізнайтесь, хто став чемпіоном.',
   'Зимовий сезон Харківської волейбольної ліги завершено. У фінальному турнірі взяли участь 24 команди. Рівень гри порадував глядачів та суддів. Чемпіони нагороджені кубками та медалями. Літній сезон стартує у червні 2026 року.',
   'news', 'published', 234),

  (1,
   'Велоперегони «Тур Карпат» 2026: маршрут та умови участі',
   'velopeerhony-tur-karpat-marshut-2026',
   'Опубліковано детальний маршрут та технічний регламент Туру Карпат 2026.',
   'Оргкомітет «Тур Карпат 2026» опублікував офіційний маршрут трьох етапів змагань. Загальна довжина траси — 320 км. До участі запрошуються спортсмени трьох класів: еліта, аматори та ветерани (45+). Реєстрація відкрита до 25 серпня 2026 року.',
   'announcement', 'published', 567)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- REGISTRATIONS (для завершених заходів)
-- events id: залежить від порядку INSERT вище
-- =============================================
DO $$
DECLARE
  ev_box_id   INT;
  ev_vol_id   INT;
  u2 INT; u3 INT; u4 INT; u5 INT; u6 INT;
BEGIN
  SELECT id INTO ev_box_id FROM events WHERE slug='zymovyi-kubok-boksu-2026'       LIMIT 1;
  SELECT id INTO ev_vol_id FROM events WHERE slug='kharkiv-zymova-volejbolna-liha' LIMIT 1;
  SELECT id INTO u2 FROM users WHERE email='kovalenko@test.ua' LIMIT 1;
  SELECT id INTO u3 FROM users WHERE email='petrenko@test.ua'  LIMIT 1;
  SELECT id INTO u4 FROM users WHERE email='bondar@test.ua'    LIMIT 1;
  SELECT id INTO u5 FROM users WHERE email='lysenko@test.ua'   LIMIT 1;
  SELECT id INTO u6 FROM users WHERE email='savchenko@test.ua' LIMIT 1;

  IF ev_box_id IS NOT NULL AND u2 IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number)
    VALUES
      (ev_box_id, u2, 'approved', 'BOX2026-001'),
      (ev_box_id, u4, 'approved', 'BOX2026-002'),
      (ev_box_id, u6, 'approved', 'BOX2026-003')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  IF ev_vol_id IS NOT NULL AND u3 IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number)
    VALUES
      (ev_vol_id, u3, 'approved', 'VOL2026-001'),
      (ev_vol_id, u5, 'approved', 'VOL2026-002')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;
END $$;

-- =============================================
-- RESULTS (для завершених заходів)
-- =============================================
DO $$
DECLARE
  ev_box_id INT;
  ev_vol_id INT;
  u2 INT; u3 INT; u4 INT; u5 INT; u6 INT;
  disc_box INT; disc_vol INT;
BEGIN
  SELECT id INTO ev_box_id FROM events WHERE slug='zymovyi-kubok-boksu-2026'       LIMIT 1;
  SELECT id INTO ev_vol_id FROM events WHERE slug='kharkiv-zymova-volejbolna-liha' LIMIT 1;
  SELECT id INTO u2 FROM users WHERE email='kovalenko@test.ua' LIMIT 1;
  SELECT id INTO u3 FROM users WHERE email='petrenko@test.ua'  LIMIT 1;
  SELECT id INTO u4 FROM users WHERE email='bondar@test.ua'    LIMIT 1;
  SELECT id INTO u5 FROM users WHERE email='lysenko@test.ua'   LIMIT 1;
  SELECT id INTO u6 FROM users WHERE email='savchenko@test.ua' LIMIT 1;
  SELECT id INTO disc_box FROM disciplines WHERE slug='boxing'    LIMIT 1;
  SELECT id INTO disc_vol FROM disciplines WHERE slug='volleyball' LIMIT 1;

  IF ev_box_id IS NOT NULL AND u2 IS NOT NULL THEN
    INSERT INTO results (event_id, user_id, place, result_value, result_unit, points)
    VALUES
      (ev_box_id, u2, 1, 'Перемога',   'місце', 100),
      (ev_box_id, u4, 2, 'Поразка',    'місце',  75),
      (ev_box_id, u6, 3, 'Нокдаун',    'місце',  50)
    ON CONFLICT DO NOTHING;
  END IF;

  IF ev_vol_id IS NOT NULL AND u3 IS NOT NULL THEN
    INSERT INTO results (event_id, user_id, place, result_value, result_unit, points)
    VALUES
      (ev_vol_id, u3, 1, 'Чемпіон', 'місце', 100),
      (ev_vol_id, u5, 2, 'Срібло',  'місце',  75)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =============================================
-- GALLERY MEDIA (24 photos already in git: public/images/gallery/)
-- uploaded_by = 1 (admin)
-- =============================================
DELETE FROM media WHERE file_path LIKE '/images/gallery/%';

INSERT INTO media (uploaded_by, file_name, file_path, file_type, mime_type, title, is_public) VALUES
  (1, 'athletics-sprint.jpg',    '/images/gallery/athletics-sprint.jpg',    'image', 'image/jpeg', 'Легка атлетика — спринт',        TRUE),
  (1, 'awards-ceremony.jpg',     '/images/gallery/awards-ceremony.jpg',     'image', 'image/jpeg', 'Церемонія нагородження',         TRUE),
  (1, 'basketball-3x3.jpg',      '/images/gallery/basketball-3x3.jpg',      'image', 'image/jpeg', 'Баскетбол 3×3',                  TRUE),
  (1, 'basketball-shot.jpg',     '/images/gallery/basketball-shot.jpg',     'image', 'image/jpeg', 'Кидок у баскетболі',             TRUE),
  (1, 'boxing-final.jpg',        '/images/gallery/boxing-final.jpg',        'image', 'image/jpeg', 'Боксинг — фінал',                TRUE),
  (1, 'carpathian-marathon.jpg', '/images/gallery/carpathian-marathon.jpg', 'image', 'image/jpeg', 'Карпатський марафон',            TRUE),
  (1, 'cycling-peloton.jpg',     '/images/gallery/cycling-peloton.jpg',     'image', 'image/jpeg', 'Велогонка — пелотон',            TRUE),
  (1, 'cycling-race.jpg',        '/images/gallery/cycling-race.jpg',        'image', 'image/jpeg', 'Велогонка',                      TRUE),
  (1, 'football-match.jpg',      '/images/gallery/football-match.jpg',      'image', 'image/jpeg', 'Футбольний матч',                TRUE),
  (1, 'football-shot.jpg',       '/images/gallery/football-shot.jpg',       'image', 'image/jpeg', 'Удар у футболі',                 TRUE),
  (1, 'gymnastics.jpg',          '/images/gallery/gymnastics.jpg',          'image', 'image/jpeg', 'Гімнастика',                     TRUE),
  (1, 'marathon-run.jpg',        '/images/gallery/marathon-run.jpg',        'image', 'image/jpeg', 'Марафон',                        TRUE),
  (1, 'sports-arena.jpg',        '/images/gallery/sports-arena.jpg',        'image', 'image/jpeg', 'Спортивна арена',                TRUE),
  (1, 'swimming-award.jpg',      '/images/gallery/swimming-award.jpg',      'image', 'image/jpeg', 'Плавання — нагорода',            TRUE),
  (1, 'swimming-freestyle.jpg',  '/images/gallery/swimming-freestyle.jpg',  'image', 'image/jpeg', 'Плавання вільним стилем',        TRUE),
  (1, 'swimming-start.jpg',      '/images/gallery/swimming-start.jpg',      'image', 'image/jpeg', 'Старт у плаванні',               TRUE),
  (1, 'team-celebration.jpg',    '/images/gallery/team-celebration.jpg',    'image', 'image/jpeg', 'Святкування команди',            TRUE),
  (1, 'tennis-court.jpg',        '/images/gallery/tennis-court.jpg',        'image', 'image/jpeg', 'Тенісний корт',                  TRUE),
  (1, 'tennis-match.jpg',        '/images/gallery/tennis-match.jpg',        'image', 'image/jpeg', 'Тенісний матч',                  TRUE),
  (1, 'track-finish.jpg',        '/images/gallery/track-finish.jpg',        'image', 'image/jpeg', 'Фінішна пряма',                  TRUE),
  (1, 'volleyball-block.jpg',    '/images/gallery/volleyball-block.jpg',    'image', 'image/jpeg', 'Блок у волейболі',               TRUE),
  (1, 'volleyball-serve.jpg',    '/images/gallery/volleyball-serve.jpg',    'image', 'image/jpeg', 'Подача у волейболі',             TRUE),
  (1, 'warmup.jpg',              '/images/gallery/warmup.jpg',              'image', 'image/jpeg', 'Розминка',                       TRUE),
  (1, 'wrestling.jpg',           '/images/gallery/wrestling.jpg',           'image', 'image/jpeg', 'Боротьба',                       TRUE);

-- =============================================
-- Підсумкова статистика
-- =============================================
SELECT 'events'        as "table", count(*) as "rows" FROM events
UNION ALL SELECT 'news',          count(*) FROM news
UNION ALL SELECT 'users',         count(*) FROM users
UNION ALL SELECT 'registrations', count(*) FROM registrations
UNION ALL SELECT 'results',       count(*) FROM results
UNION ALL SELECT 'media',         count(*) FROM media;
