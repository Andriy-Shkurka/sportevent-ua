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
-- ДОДАТКОВІ КОРИСТУВАЧІ (пароль: Test@2025)
-- =============================================
INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, birth_date, city, is_active, email_verified) VALUES
  -- спортсмени
  (2, 'kovalchuk@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Олена',     'Ковальчук',  '+380501234580', '2001-04-12', 'Полтава',        TRUE, TRUE),
  (2, 'hrytsenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Максим',    'Гриценко',   '+380671234581', '1999-07-03', 'Рівне',          TRUE, TRUE),
  (2, 'ponomarenko@test.ua','$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Юлія',      'Пономаренко','+380931234582', '2003-01-25', 'Запоріжжя',      TRUE, TRUE),
  (2, 'tkachenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Богдан',    'Ткаченко',   '+380961234583', '2000-09-18', 'Чернівці',       TRUE, TRUE),
  (2, 'marchenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Наталія',   'Марченко',   '+380731234584', '1997-12-07', 'Кропивницький',  TRUE, TRUE),
  (2, 'sydorenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Роман',     'Сидоренко',  '+380501234585', '2002-06-14', 'Тернопіль',      TRUE, TRUE),
  (2, 'kravchenko@test.ua', '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Вікторія',  'Кравченко',  '+380671234586', '1998-03-29', 'Суми',           TRUE, TRUE),
  (2, 'haiduk@test.ua',     '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Денис',     'Гайдук',     '+380931234587', '2001-11-11', 'Луцьк',          TRUE, TRUE),
  (2, 'zhuk@test.ua',       '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Катерина',  'Жук',        '+380961234588', '1996-08-20', 'Ужгород',        TRUE, TRUE),
  (2, 'nazarenko@test.ua',  '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Ігор',      'Назаренко',  '+380731234589', '2004-02-05', 'Миколаїв',       TRUE, TRUE),
  -- команди
  (3, 'shakhtar@test.ua',   '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Команда',   'Шахтар',     '+380621234590', '1990-01-01', 'Дніпро',         TRUE, TRUE),
  (3, 'karpaty@test.ua',    '$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC', 'Команда',   'Карпати',    '+380321234591', '1990-01-01', 'Львів',          TRUE, TRUE),
  (3, 'chornomorets@test.ua','$2b$10$jfkVNHpqwSl2NqHzC5MvBe0dFYFWPqxuLPFXr1/Td4Xz8fXpKGrPC','Команда',   'Чорноморець','+380481234592', '1990-01-01', 'Одеса',          TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- TEAM MEMBERS (учасники команд)
-- =============================================
DO $$
DECLARE
  t_dynamo      INT;
  t_shakhtar    INT;
  t_karpaty     INT;
  t_chornomorets INT;
BEGIN
  SELECT id INTO t_dynamo       FROM users WHERE email='dynamo@test.ua'      LIMIT 1;
  SELECT id INTO t_shakhtar     FROM users WHERE email='shakhtar@test.ua'    LIMIT 1;
  SELECT id INTO t_karpaty      FROM users WHERE email='karpaty@test.ua'     LIMIT 1;
  SELECT id INTO t_chornomorets FROM users WHERE email='chornomorets@test.ua' LIMIT 1;

  -- Динамо (Київ) — 6 гравців
  IF t_dynamo IS NOT NULL THEN
    INSERT INTO team_members (team_user_id, first_name, last_name, birth_date, position) VALUES
      (t_dynamo, 'Артем',    'Білик',      '2000-03-12', 'Капітан / Захисник'),
      (t_dynamo, 'Сергій',   'Гонта',      '2001-07-24', 'Нападник'),
      (t_dynamo, 'Павло',    'Мельник',    '1999-11-05', 'Воротар'),
      (t_dynamo, 'Олексій',  'Захарченко', '2002-01-18', 'Захисник'),
      (t_dynamo, 'Микола',   'Яремчук',    '2000-09-30', 'Хавбек'),
      (t_dynamo, 'Іван',     'Остапенко',  '1998-05-14', 'Нападник');
  END IF;

  -- Шахтар (Дніпро) — 6 гравців
  IF t_shakhtar IS NOT NULL THEN
    INSERT INTO team_members (team_user_id, first_name, last_name, birth_date, position) VALUES
      (t_shakhtar, 'Владислав', 'Коваль',    '2000-06-08', 'Капітан / Хавбек'),
      (t_shakhtar, 'Тарас',     'Вергун',    '2001-12-15', 'Нападник'),
      (t_shakhtar, 'Євген',     'Кривоніс',  '1999-04-22', 'Воротар'),
      (t_shakhtar, 'Дмитро',    'Панченко',  '2002-08-09', 'Захисник'),
      (t_shakhtar, 'Антон',     'Береза',    '2000-02-27', 'Захисник'),
      (t_shakhtar, 'Станіслав', 'Лисиця',   '1998-10-03', 'Нападник');
  END IF;

  -- Карпати (Львів) — 5 гравців
  IF t_karpaty IS NOT NULL THEN
    INSERT INTO team_members (team_user_id, first_name, last_name, birth_date, position) VALUES
      (t_karpaty, 'Ярослав',   'Гаврилів',   '2000-01-14', 'Капітан / Нападник'),
      (t_karpaty, 'Роман',     'Федів',       '2001-05-20', 'Хавбек'),
      (t_karpaty, 'Андрій',    'Слободян',    '1999-09-11', 'Воротар'),
      (t_karpaty, 'Орест',     'Процик',      '2002-03-06', 'Захисник'),
      (t_karpaty, 'Юрій',      'Стець',       '2000-11-29', 'Захисник');
  END IF;

  -- Чорноморець (Одеса) — 5 гравців
  IF t_chornomorets IS NOT NULL THEN
    INSERT INTO team_members (team_user_id, first_name, last_name, birth_date, position) VALUES
      (t_chornomorets, 'Микита',   'Морозов',    '2001-02-17', 'Капітан / Захисник'),
      (t_chornomorets, 'Олег',     'Іщенко',     '2000-08-04', 'Нападник'),
      (t_chornomorets, 'Віталій',  'Дяченко',    '1999-12-22', 'Воротар'),
      (t_chornomorets, 'Артур',    'Балабан',    '2002-06-13', 'Хавбек'),
      (t_chornomorets, 'Кирило',   'Власенко',   '2001-10-08', 'Захисник');
  END IF;
END $$;

-- =============================================
-- ДОДАТКОВІ ЗАХОДИ (ще 8 — різні дисципліни)
-- =============================================
INSERT INTO events
  (discipline_id, location_id, created_by, title, slug,
   description, start_date, end_date, registration_deadline,
   max_participants, entry_fee, status, is_featured)
VALUES
  (2, 1, 1,
   'Весняний кубок з плавання «Хвиля»',
   'vesnianyi-kubok-plavannia-khvylia',
   'Змагання в 50-метровому басейні НСК. Дистанції: 50 м, 100 м, 200 м, 400 м вільним стилем та брасом.',
   '2026-03-28 09:00:00', '2026-03-29 17:00:00', '2026-03-22 23:59:59',
   120, 200.00, 'registration_open', FALSE),

  (4, 3, 1,
   'Відкритий турнір з баскетболу 3×3 у Харкові',
   'turнір-basketbol-3x3-kharkiv',
   'Стрітбол 3×3 — командний турнір. Міські та обласні команди у чоловічому та жіночому розрядах.',
   '2026-04-04 10:00:00', '2026-04-05 18:00:00', '2026-03-30 23:59:59',
   48, 600.00, 'registration_open', FALSE),

  (6, 4, 1,
   'Перший Відкритий тенісний турнір Львова',
   'pershyi-tenisny-turнір-lvova',
   'Одиночний та парний розряди. Покриття — відкритий корт. Чоловічий та жіночий розряди.',
   '2026-05-23 09:00:00', '2026-05-25 19:00:00', '2026-05-16 23:59:59',
   64, 450.00, 'registration_open', FALSE),

  (1, 2, 1,
   'Нічний пробіг Киє́вом «Нічний старт»',
   'nichnyi-probih-kyievom',
   'Унікальний нічний забіг освітленими вулицями Подолу та набережної. Дистанції: 5 і 10 км.',
   '2026-06-20 22:00:00', '2026-06-21 01:00:00', '2026-06-15 23:59:59',
   300, 120.00, 'upcoming', TRUE),

  (10, 2, 1,
   'Дитячий фестиваль гімнастики «Перший крок»',
   'dytiachyi-festival-himnastyky',
   'Показові виступи та змагання для юних гімнасток 5–12 років. Групові та індивідуальні програми.',
   '2026-07-05 10:00:00', '2026-07-05 17:00:00', '2026-06-28 23:59:59',
   60, 100.00, 'upcoming', FALSE),

  (3, 1, 1,
   'Міжнародний турнір з міні-футболу «Кубок Незалежності»',
   'mizhnarodnyi-turнір-mini-futbol-kubok-nezalezhnosti',
   'Представницький командний турнір з нагоди Дня Незалежності. Команди з 5 країн.',
   '2026-08-22 10:00:00', '2026-08-24 18:00:00', '2026-08-10 23:59:59',
   16, 2000.00, 'upcoming', TRUE),

  (9, 4, 1,
   'Гірський велотріатлон «Карпатська вершина»',
   'hirskoyi-velotriatlon-karpatska-vershyna',
   'Комбінований старт: підйом на велосипеді, пробіжка та орієнтування у горах. Для аматорів та еліти.',
   '2026-09-19 08:00:00', '2026-09-20 17:00:00', '2026-09-05 23:59:59',
   80, 700.00, 'upcoming', FALSE),

  (7, 3, 1,
   'Кубок Харкова з греко-римської боротьби',
   'kubok-kharkova-hreko-rymska-borotba',
   'Офіційний турнір з греко-римської боротьби серед юніорів (U18) та дорослих. Всі вагові категорії.',
   '2026-11-07 10:00:00', '2026-11-08 17:00:00', '2026-10-28 23:59:59',
   80, 300.00, 'upcoming', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- ДОДАТКОВІ НОВИНИ
-- =============================================
INSERT INTO news (author_id, title, slug, excerpt, content, category, status, views) VALUES
  (1,
   'Нові локації для змагань 2026 року',
   'novi-lokatsii-zmahannia-2026',
   'СпортUA розширює географію заходів: три нові міста приймуть офіційні змагання цього сезону.',
   'Із задоволенням повідомляємо про розширення мережі партнерських спортивних об`єктів. Цьогоріч нові заходи заплановані в Дніпрі, Тернополі та Ужгороді. Усі локації відповідають стандартам безпеки та мають сучасну інфраструктуру.',
   'announcement', 'published', 198),

  (1,
   'Як правильно обрати дисципліну для участі',
   'iak-obraty-dystsyplinu-dlia-uchasti',
   'Коротка покрокова інструкція для новачків, які вперше реєструються на спортивний захід.',
   'Перша реєстрація на змагання — завжди хвилюючий момент. Ми підготували покрокову інструкцію: як знайти підходящий захід на нашому порталі, перевірити вікові обмеження та вагові категорії, а також правильно заповнити форму реєстрації.',
   'blog', 'published', 445),

  (1,
   'Рейтинг найкращих спортсменів — підсумки лютого 2026',
   'reitynh-sportsmeniv-liutyi-2026',
   'Опубліковано оновлений рейтинг учасників за підсумками лютневих змагань.',
   'За результатами Зимового кубка з боксу та Харківської волейбольної ліги сформовано перший рейтинг поточного сезону. Лідерами стали спортсмени з Києва, Харкова та Одеси. Наступне оновлення рейтингу — після квітневих змагань.',
   'news', 'published', 312),

  (1,
   'Правила антидопінгового контролю на змаганнях СпортUA',
   'pravyla-antydopinhovoho-kontroliu',
   'Нагадуємо учасникам про обов`язкові вимоги щодо антидопінгового контролю.',
   'Усі учасники офіційних змагань зобов`язані дотримуватись антидопінгового законодавства України. На заходах категорії A та B проводиться вибірковий допінг-контроль. Список заборонених речовин — на офіційному сайті НАДАСУ.',
   'news', 'published', 167),

  (1,
   'Велоперегони «Тур Карпат»: зустріч з учасниками',
   'veloperehony-tur-karpat-zustrich',
   'Відкрита зустріч з організаторами та досвідченими гонщиками відбудеться 15 квітня у Львові.',
   'Організаційний комітет «Тур Карпат 2026» запрошує всіх зареєстрованих учасників та охочих на відкриту зустріч. Обговоримо маршрут, технічний регламент, харчування та розміщення. Зустріч відбудеться 15 квітня о 18:00 у Спортивному клубі «Галичина», Львів.',
   'announcement', 'published', 534)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- РЕЄСТРАЦІЇ НА ВІДКРИТІ ЗАХОДИ
-- =============================================
DO $$
DECLARE
  ev_mar INT; ev_box2 INT; ev_swim INT; ev_swim2 INT; ev_bb INT;
  ev_ten INT; ev_wave INT;
  u_kov INT; u_pet INT; u_bon INT; u_lys INT; u_sav INT;
  u_mor INT; u_shev INT;
  u_kvc INT; u_hry INT; u_pon INT; u_tkc INT; u_mar INT;
  u_syd INT; u_kra INT; u_hai INT; u_zhk INT; u_naz INT;
  u_dyn INT; u_sha INT; u_kar INT; u_cho INT;
BEGIN
  -- events
  SELECT id INTO ev_mar  FROM events WHERE slug='vesnianyi-lehkoatletychnyi-marafon'   LIMIT 1;
  SELECT id INTO ev_box2 FROM events WHERE slug='vidkrytyi-chempionat-kyieva-boksu'    LIMIT 1;
  SELECT id INTO ev_swim FROM events WHERE slug='kubok-ukrainy-plavannia'               LIMIT 1;
  SELECT id INTO ev_swim2 FROM events WHERE slug='vesnianyi-kubok-plavannia-khvylia'    LIMIT 1;
  SELECT id INTO ev_bb   FROM events WHERE slug='turнір-basketbol-3x3-kharkiv'         LIMIT 1;
  SELECT id INTO ev_ten  FROM events WHERE slug='vidkrytyi-tenisny-turнір-osinniy-kubok' LIMIT 1;
  SELECT id INTO ev_wave FROM events WHERE slug='pershyi-tenisny-turнір-lvova'          LIMIT 1;

  -- users (orig)
  SELECT id INTO u_kov  FROM users WHERE email='kovalenko@test.ua'  LIMIT 1;
  SELECT id INTO u_pet  FROM users WHERE email='petrenko@test.ua'   LIMIT 1;
  SELECT id INTO u_bon  FROM users WHERE email='bondar@test.ua'     LIMIT 1;
  SELECT id INTO u_lys  FROM users WHERE email='lysenko@test.ua'    LIMIT 1;
  SELECT id INTO u_sav  FROM users WHERE email='savchenko@test.ua'  LIMIT 1;
  SELECT id INTO u_mor  FROM users WHERE email='moroz@test.ua'      LIMIT 1;
  SELECT id INTO u_shev FROM users WHERE email='shevchuk@test.ua'   LIMIT 1;

  -- users (new)
  SELECT id INTO u_kvc  FROM users WHERE email='kovalchuk@test.ua'  LIMIT 1;
  SELECT id INTO u_hry  FROM users WHERE email='hrytsenko@test.ua'   LIMIT 1;
  SELECT id INTO u_pon  FROM users WHERE email='ponomarenko@test.ua' LIMIT 1;
  SELECT id INTO u_tkc  FROM users WHERE email='tkachenko@test.ua'   LIMIT 1;
  SELECT id INTO u_mar  FROM users WHERE email='marchenko@test.ua'   LIMIT 1;
  SELECT id INTO u_syd  FROM users WHERE email='sydorenko@test.ua'   LIMIT 1;
  SELECT id INTO u_kra  FROM users WHERE email='kravchenko@test.ua'  LIMIT 1;
  SELECT id INTO u_hai  FROM users WHERE email='haiduk@test.ua'      LIMIT 1;
  SELECT id INTO u_zhk  FROM users WHERE email='zhuk@test.ua'        LIMIT 1;
  SELECT id INTO u_naz  FROM users WHERE email='nazarenko@test.ua'   LIMIT 1;

  -- teams
  SELECT id INTO u_dyn FROM users WHERE email='dynamo@test.ua'       LIMIT 1;
  SELECT id INTO u_sha FROM users WHERE email='shakhtar@test.ua'     LIMIT 1;
  SELECT id INTO u_kar FROM users WHERE email='karpaty@test.ua'      LIMIT 1;
  SELECT id INTO u_cho FROM users WHERE email='chornomorets@test.ua' LIMIT 1;

  -- Марафон (реєстрація відкрита)
  IF ev_mar IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_mar, u_kov,  'pending',  'MAR2026-001'),
      (ev_mar, u_pet,  'pending',  'MAR2026-002'),
      (ev_mar, u_bon,  'approved', 'MAR2026-003'),
      (ev_mar, u_lys,  'pending',  'MAR2026-004'),
      (ev_mar, u_sav,  'approved', 'MAR2026-005'),
      (ev_mar, u_kvc,  'pending',  'MAR2026-006'),
      (ev_mar, u_hry,  'approved', 'MAR2026-007'),
      (ev_mar, u_pon,  'pending',  'MAR2026-008'),
      (ev_mar, u_syd,  'pending',  'MAR2026-009'),
      (ev_mar, u_naz,  'approved', 'MAR2026-010')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Чемпіонат Києва з боксу
  IF ev_box2 IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_box2, u_kov,  'approved', 'BOX2K-001'),
      (ev_box2, u_shev, 'approved', 'BOX2K-002'),
      (ev_box2, u_hai,  'pending',  'BOX2K-003'),
      (ev_box2, u_tkc,  'pending',  'BOX2K-004'),
      (ev_box2, u_naz,  'approved', 'BOX2K-005')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Кубок України з плавання
  IF ev_swim IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_swim, u_pet,  'pending',  'SWIM-001'),
      (ev_swim, u_mor,  'approved', 'SWIM-002'),
      (ev_swim, u_kvc,  'pending',  'SWIM-003'),
      (ev_swim, u_pon,  'approved', 'SWIM-004'),
      (ev_swim, u_zhk,  'pending',  'SWIM-005'),
      (ev_swim, u_mar,  'pending',  'SWIM-006')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Весняний кубок з плавання
  IF ev_swim2 IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_swim2, u_pet,  'approved', 'SWAV-001'),
      (ev_swim2, u_mor,  'approved', 'SWAV-002'),
      (ev_swim2, u_zhk,  'pending',  'SWAV-003'),
      (ev_swim2, u_lys,  'pending',  'SWAV-004')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Баскетбол 3×3 (команди)
  IF ev_bb IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_bb, u_dyn, 'approved', 'BB3-001'),
      (ev_bb, u_sha, 'pending',  'BB3-002'),
      (ev_bb, u_kar, 'pending',  'BB3-003')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;

  -- Тенісний турнір «Осінній кубок»
  IF ev_ten IS NOT NULL THEN
    INSERT INTO registrations (event_id, user_id, status, registration_number) VALUES
      (ev_ten, u_kra, 'pending', 'TEN-001'),
      (ev_ten, u_syd, 'pending', 'TEN-002'),
      (ev_ten, u_bon, 'pending', 'TEN-003')
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;
END $$;

-- =============================================
-- NOTIFICATIONS (повідомлення для користувачів)
-- =============================================
DO $$
DECLARE
  u_kov INT; u_pet INT; u_bon INT; u_lys INT; u_sav INT;
  u_mor INT; u_shev INT; u_hry INT; u_pon INT; u_tkc INT;
  u_mar INT; u_syd INT; u_kra INT; u_hai INT; u_zhk INT; u_naz INT;
  u_dyn INT; u_sha INT; u_kar INT; u_cho INT;
BEGIN
  SELECT id INTO u_kov  FROM users WHERE email='kovalenko@test.ua'   LIMIT 1;
  SELECT id INTO u_pet  FROM users WHERE email='petrenko@test.ua'    LIMIT 1;
  SELECT id INTO u_bon  FROM users WHERE email='bondar@test.ua'      LIMIT 1;
  SELECT id INTO u_lys  FROM users WHERE email='lysenko@test.ua'     LIMIT 1;
  SELECT id INTO u_sav  FROM users WHERE email='savchenko@test.ua'   LIMIT 1;
  SELECT id INTO u_mor  FROM users WHERE email='moroz@test.ua'       LIMIT 1;
  SELECT id INTO u_shev FROM users WHERE email='shevchuk@test.ua'    LIMIT 1;
  SELECT id INTO u_hry  FROM users WHERE email='hrytsenko@test.ua'   LIMIT 1;
  SELECT id INTO u_pon  FROM users WHERE email='ponomarenko@test.ua' LIMIT 1;
  SELECT id INTO u_tkc  FROM users WHERE email='tkachenko@test.ua'   LIMIT 1;
  SELECT id INTO u_mar  FROM users WHERE email='marchenko@test.ua'   LIMIT 1;
  SELECT id INTO u_syd  FROM users WHERE email='sydorenko@test.ua'   LIMIT 1;
  SELECT id INTO u_kra  FROM users WHERE email='kravchenko@test.ua'  LIMIT 1;
  SELECT id INTO u_hai  FROM users WHERE email='haiduk@test.ua'      LIMIT 1;
  SELECT id INTO u_zhk  FROM users WHERE email='zhuk@test.ua'        LIMIT 1;
  SELECT id INTO u_naz  FROM users WHERE email='nazarenko@test.ua'   LIMIT 1;
  SELECT id INTO u_dyn  FROM users WHERE email='dynamo@test.ua'      LIMIT 1;
  SELECT id INTO u_sha  FROM users WHERE email='shakhtar@test.ua'    LIMIT 1;
  SELECT id INTO u_kar  FROM users WHERE email='karpaty@test.ua'     LIMIT 1;
  SELECT id INTO u_cho  FROM users WHERE email='chornomorets@test.ua' LIMIT 1;

  INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
    -- Коваленко
    (u_kov, 'Реєстрацію підтверджено', 'Вашу реєстрацію на «Весняний легкоатлетичний марафон» підтверджено. Бажаємо удачі!', 'success', FALSE, '/cabinet/registrations'),
    (u_kov, 'Результати Зимового кубка з боксу', 'Ви посіли 1-е місце на Зимовому кубку з боксу 2026. Вітаємо чемпіона!', 'success', TRUE, '/cabinet/results'),

    -- Петренко
    (u_pet, 'Реєстрація на марафон отримана', 'Дякуємо за реєстрацію на «Весняний марафон». Очікуйте підтвердження від організаторів.', 'info', FALSE, '/cabinet/registrations'),
    (u_pet, 'Завершено: Харківська волейбольна ліга', 'Результати турніру внесено до вашого профілю. Ви отримали 1-е місце!', 'success', TRUE, '/cabinet/results'),

    -- Бондар
    (u_bon, 'Реєстрацію підтверджено — Марафон', 'Ваша реєстрація на «Весняний марафон» підтверджена. Стартовий номер буде відправлено на email.', 'success', FALSE, '/cabinet/registrations'),
    (u_bon, 'Нагадування: марафон через 14 днів', 'Нагадуємо, що Весняний марафон відбудеться 12 квітня. Підготуйтесь!', 'info', FALSE, '/events'),

    -- Лисенко
    (u_lys, 'Реєстрація отримана', 'Ваша заявка на «Весняний марафон» прийнята. Статус: на розгляді.', 'info', TRUE, '/cabinet/registrations'),
    (u_lys, 'Результати волейбольного турніру', 'Харківська ліга завершена. Ви посіли 2-е місце. Чудовий результат!', 'success', TRUE, '/cabinet/results'),

    -- Савченко
    (u_sav, 'Реєстрацію підтверджено — Марафон', 'Ваша участь у «Весняному марафоні» підтверджена адміністратором.', 'success', FALSE, '/cabinet/registrations'),
    (u_sav, 'Результат Зимового кубка з боксу', 'Ви посіли 3-є місце на Зимовому кубку з боксу. Вітаємо з призовим місцем!', 'success', TRUE, '/cabinet/results'),

    -- Мороз
    (u_mor, 'Реєстрацію підтверджено — Плавання', 'Ваша участь у «Кубку України з плавання» підтверджена. Старт 10 травня!', 'success', FALSE, '/cabinet/registrations'),
    (u_mor, 'Нова дисципліна доступна', 'На порталі відкрито реєстрацію на «Весняний кубок з плавання». Заповніть заявку!', 'info', FALSE, '/events'),

    -- Шевчук
    (u_shev, 'Заявку на бокс отримано', 'Ваша реєстрація на «Чемпіонат Києва з боксу» перебуває на розгляді.', 'info', TRUE, '/cabinet/registrations'),
    (u_shev, 'Профіль не заповнено', 'Заповніть дату народження та місто для коректного відображення в рейтингах.', 'warning', FALSE, '/cabinet/profile'),

    -- Гриценко
    (u_hry, 'Марафон — реєстрацію підтверджено', 'Вашу участь у «Весняному марафоні» підтверджено! Удачі на старті.', 'success', FALSE, '/cabinet/registrations'),
    (u_hry, 'Відкрито нові заходи у вашому місті', 'У Рівному та регіоні з''явились нові заходи. Перегляньте розклад!', 'info', FALSE, '/events'),

    -- Пономаренко
    (u_pon, 'Реєстрація отримана — Плавання', 'Дякуємо за реєстрацію на «Кубок України з плавання». Очікуйте підтвердження.', 'info', FALSE, '/cabinet/registrations'),
    (u_pon, 'Нагадування про дедлайн', 'Реєстрація на «Весняний марафон» закривається 5 квітня. Встигніть подати заявку!', 'warning', TRUE, '/events'),

    -- Ткаченко
    (u_tkc, 'Заявку на бокс отримано', 'Ваша заявка на «Чемпіонат Києва з боксу» прийнята та розглядається.', 'info', FALSE, '/cabinet/registrations'),

    -- Марченко
    (u_mar, 'Реєстрація на плавання — очікує', 'Ваша заявка на «Кубок України з плавання» прийнята. Статус: на розгляді.', 'info', FALSE, '/cabinet/registrations'),

    -- Сидоренко
    (u_syd, 'Реєстрацію отримано — Марафон', 'Заявка на «Весняний марафон» прийнята. Очікуйте підтвердження.', 'info', FALSE, '/cabinet/registrations'),
    (u_syd, 'Запрошення на тенісний турнір', 'Ви можете зареєструватись на «Відкритий тенісний турнір «Осінній кубок»». Реєстрація до 10 жовтня.', 'info', FALSE, '/events'),

    -- Кравченко
    (u_kra, 'Реєстрація — Тенісний турнір', 'Ваша заявка на «Відкритий тенісний турнір» отримана. Очікуйте підтвердження.', 'info', FALSE, '/cabinet/registrations'),

    -- Гайдук
    (u_hai, 'Заявку на бокс підтверджено', 'Ваша реєстрація на «Чемпіонат Києва з боксу» підтверджена. Успіхів!', 'success', FALSE, '/cabinet/registrations'),

    -- Жук
    (u_zhk, 'Реєстрація на плавання', 'Ваша заявка на «Весняний кубок з плавання» прийнята. Очікуйте підтвердження.', 'info', FALSE, '/cabinet/registrations'),
    (u_zhk, 'Профіль: додайте фото', 'Додайте аватар до профілю, щоб вас впізнавали на порталі!', 'info', TRUE, '/cabinet/profile'),

    -- Назаренко
    (u_naz, 'Марафон — підтверджено', 'Ваша участь у «Весняному марафоні» підтверджена! До зустрічі на старті.', 'success', FALSE, '/cabinet/registrations'),
    (u_naz, 'Бокс — підтверджено', 'Участь у «Чемпіонаті Києва з боксу» підтверджена. Вдалих поєдинків!', 'success', FALSE, '/cabinet/registrations'),

    -- Команда Динамо
    (u_dyn, 'Реєстрацію команди підтверджено', 'Команду «Динамо» зареєстровано на турнір з баскетболу 3×3. Удачі!', 'success', FALSE, '/cabinet/registrations'),
    (u_dyn, 'Нагадування: турнір через 3 тижні', 'Турнір з баскетболу 3×3 у Харкові відбудеться 4–5 квітня. Підготуйте склад!', 'info', FALSE, '/events'),

    -- Команда Шахтар
    (u_sha, 'Заявку команди отримано', 'Заявку команди «Шахтар» на баскетбольний турнір 3×3 отримано. Статус: на розгляді.', 'info', FALSE, '/cabinet/registrations'),

    -- Команда Карпати
    (u_kar, 'Заявку команди отримано', 'Заявку команди «Карпати» на баскетбол 3×3 прийнято. Очікуйте рішення.', 'info', TRUE, '/cabinet/registrations'),
    (u_kar, 'Додайте учасників команди', 'Перейдіть до профілю та заповніть список гравців команди.', 'warning', FALSE, '/cabinet/profile'),

    -- Команда Чорноморець
    (u_cho, 'Ласкаво просимо до СпортUA!', 'Реєстрацію команди «Чорноморець» завершено. Заповніть профіль та реєструйтесь на змагання.', 'info', FALSE, '/cabinet/profile')
  ;
END $$;

-- =============================================
-- Підсумкова статистика
-- =============================================
SELECT 'events'        as "table", count(*) as "rows" FROM events
UNION ALL SELECT 'news',          count(*) FROM news
UNION ALL SELECT 'users',         count(*) FROM users
UNION ALL SELECT 'registrations', count(*) FROM registrations
UNION ALL SELECT 'results',       count(*) FROM results
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'team_members',  count(*) FROM team_members
UNION ALL SELECT 'media',         count(*) FROM media;
