-- =============================================
-- СпортUA — PostgreSQL Schema (Render)
-- Converted from MySQL schema
-- =============================================
\encoding UTF8

-- ROLES
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMP    DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('admin',   'Адміністратор системи'),
  ('athlete', 'Спортсмен'),
  ('team',    'Представник команди'),
  ('visitor', 'Відвідувач')
ON CONFLICT (name) DO NOTHING;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  role_id        INT          DEFAULT 2 REFERENCES roles(id) ON DELETE SET NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(30),
  birth_date     DATE,
  city           VARCHAR(100),
  country        VARCHAR(100) DEFAULT 'Україна',
  bio            TEXT,
  avatar         VARCHAR(500),
  is_active      BOOLEAN      DEFAULT TRUE,
  is_blocked     BOOLEAN      DEFAULT FALSE,
  email_verified BOOLEAN      DEFAULT FALSE,
  last_login     TIMESTAMP,
  created_at     TIMESTAMP    DEFAULT NOW(),
  updated_at     TIMESTAMP    DEFAULT NOW()
);

-- Auto-update updated_at trigger (applied after all tables created)

-- DISCIPLINES
CREATE TABLE IF NOT EXISTS disciplines (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(100),
  is_active   BOOLEAN   DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO disciplines (name, slug, description, icon) VALUES
  ('Легка атлетика',         'athletics',           'Біг, стрибки, метання',                     'icon-athletics'),
  ('Плавання',               'swimming',            'Спортивне плавання',                         'icon-swimming'),
  ('Футбол',                 'football',            'Футбол 11×11 та міні-футбол (футзал)',        'icon-football'),
  ('Баскетбол',              'basketball',          'Баскетбол 5×5 та стрітбол 3×3',              'icon-basketball'),
  ('Волейбол',               'volleyball',          'Класичний та пляжний волейбол',               'icon-volleyball'),
  ('Великий теніс',          'tennis',              'Лаун-теніс на відкритих і закритих кортах',   'icon-tennis'),
  ('Греко-римська боротьба', 'wrestling',           'Класична греко-римська боротьба',             'icon-wrestling'),
  ('Бокс',                   'boxing',              'Аматорський та професійний бокс',             'icon-boxing'),
  ('Велоспорт',              'cycling',             'Шосейний, трековий та гірський велоспорт',    'icon-cycling'),
  ('Художня гімнастика',     'gymnastics',          'Художня та спортивна гімнастика',             'icon-gymnastics'),
  ('Вільна боротьба',        'freestyle-wrestling', 'Спортивна вільна боротьба',                   'icon-wrestling'),
  ('Настільний теніс',       'table-tennis',        'Настільний теніс (пінг-понг)',                'icon-table-tennis'),
  ('Міні-футбол',            'mini-football',       'Футзал — командний міні-футбол у залі',       'icon-football')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;

-- LOCATIONS / VENUES
CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  address     VARCHAR(500),
  city        VARCHAR(100),
  country     VARCHAR(100) DEFAULT 'Україна',
  capacity    INT,
  description TEXT,
  latitude    DECIMAL(10,8),
  longitude   DECIMAL(11,8),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id                    SERIAL PRIMARY KEY,
  discipline_id         INT          NOT NULL REFERENCES disciplines(id) ON DELETE RESTRICT,
  location_id           INT          REFERENCES locations(id) ON DELETE SET NULL,
  created_by            INT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title                 VARCHAR(300) NOT NULL,
  slug                  VARCHAR(300) NOT NULL UNIQUE,
  description           TEXT,
  rules                 TEXT,
  start_date            TIMESTAMP    NOT NULL,
  end_date              TIMESTAMP,
  registration_deadline TIMESTAMP,
  max_participants      INT,
  min_age               INT,
  max_age               INT,
  entry_fee             DECIMAL(10,2) DEFAULT 0.00,
  currency              VARCHAR(10)   DEFAULT 'UAH',
  status                VARCHAR(30)   DEFAULT 'draft'
                          CHECK (status IN ('draft','upcoming','registration_open',
                                            'registration_closed','ongoing','completed','cancelled')),
  cover_image           VARCHAR(500),
  is_featured           BOOLEAN       DEFAULT FALSE,
  prize_pool            TEXT,
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
);

-- REGISTRATIONS
CREATE TABLE IF NOT EXISTS registrations (
  id                  SERIAL PRIMARY KEY,
  event_id            INT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id             INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','withdrawn','waitlist')),
  registration_number VARCHAR(50) UNIQUE,
  team_name           VARCHAR(200),
  notes               TEXT,
  admin_notes         TEXT,
  documents           VARCHAR(500),
  registered_at       TIMESTAMP   DEFAULT NOW(),
  updated_at          TIMESTAMP   DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- RESULTS
CREATE TABLE IF NOT EXISTS results (
  id                     SERIAL PRIMARY KEY,
  event_id               INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id                INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_id        INT REFERENCES registrations(id) ON DELETE SET NULL,
  place                  INT,
  result_value           VARCHAR(100),
  result_unit            VARCHAR(50),
  points                 INT     DEFAULT 0,
  disqualified           BOOLEAN DEFAULT FALSE,
  disqualification_reason TEXT,
  notes                  TEXT,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

-- NEWS
CREATE TABLE IF NOT EXISTS news (
  id           SERIAL PRIMARY KEY,
  author_id    INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_id     INT REFERENCES events(id) ON DELETE SET NULL,
  title        VARCHAR(400) NOT NULL,
  slug         VARCHAR(400) NOT NULL UNIQUE,
  excerpt      TEXT,
  content      TEXT NOT NULL,
  cover_image  VARCHAR(500),
  category     VARCHAR(20) DEFAULT 'news'
                 CHECK (category IN ('news','blog','analytics','announcement')),
  status       VARCHAR(20) DEFAULT 'draft'
                 CHECK (status IN ('draft','published','archived')),
  views        INT     DEFAULT 0,
  is_featured  BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- MEDIA FILES
CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_id    INT REFERENCES events(id) ON DELETE SET NULL,
  news_id     INT REFERENCES news(id) ON DELETE SET NULL,
  file_name   VARCHAR(500) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  file_type   VARCHAR(20) DEFAULT 'image'
                CHECK (file_type IN ('image','video','document','other')),
  mime_type   VARCHAR(100),
  file_size   INT,
  title       VARCHAR(300),
  alt_text    VARCHAR(300),
  is_public   BOOLEAN   DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(300) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'info'
               CHECK (type IN ('info','success','warning','error')),
  is_read    BOOLEAN   DEFAULT FALSE,
  link       VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PARTNERS / SPONSORS
CREATE TABLE IF NOT EXISTS partners (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  logo        VARCHAR(500),
  website     VARCHAR(500),
  description TEXT,
  type        VARCHAR(20) DEFAULT 'partner'
                CHECK (type IN ('partner','sponsor','media')),
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT     DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- FAQ
CREATE TABLE IF NOT EXISTS faq (
  id         SERIAL PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  category   VARCHAR(100) DEFAULT 'general',
  sort_order INT          DEFAULT 0,
  is_active  BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMP    DEFAULT NOW()
);

-- CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(30),
  subject     VARCHAR(300),
  message     TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'new'
                CHECK (status IN ('new','read','replied','closed')),
  admin_reply TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- RANKINGS (Aggregate)
CREATE TABLE IF NOT EXISTS rankings (
  id                  SERIAL PRIMARY KEY,
  user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discipline_id       INT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  season_year         INT NOT NULL,
  total_points        INT DEFAULT 0,
  events_participated INT DEFAULT 0,
  gold_medals         INT DEFAULT 0,
  silver_medals       INT DEFAULT 0,
  bronze_medals       INT DEFAULT 0,
  rank_position       INT,
  updated_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, discipline_id, season_year)
);

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id           SERIAL PRIMARY KEY,
  team_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  birth_date   DATE,
  position     VARCHAR(100),
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(team_user_id);

-- =============================================
-- updated_at auto-update trigger
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','events','registrations','results','news','contact_messages','rankings'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated ON %I;
       CREATE TRIGGER trg_%I_updated
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- =============================================
-- BASE DATA
-- =============================================
INSERT INTO locations (name, address, city, capacity) VALUES
  ('НСК Олімпійський',  'вул. Велика Васильківська, 55', 'Київ',  70000),
  ('Палац спорту',       'пл. Спортивна, 1',              'Київ',  10000),
  ('Стадіон Металіст',   'вул. Плехановська, 66',         'Харків', 38633),
  ('Арена Львів',        'вул. Стрийська, 199',           'Львів',  35050)
ON CONFLICT DO NOTHING;

INSERT INTO faq (question, answer, category, sort_order) VALUES
  ('Як зареєструватися на змагання?',
   'Для реєстрації необхідно створити обліковий запис на сайті, увійти в особистий кабінет та подати заявку на бажаний захід.',
   'registration', 1),
  ('Які документи потрібні для участі?',
   'Зазвичай потрібні паспорт або інший документ, що посвідчує особу, медична довідка та страховий поліс.',
   'registration', 2),
  ('Як дізнатися результати змагань?',
   'Результати публікуються на сторінці відповідного заходу після його завершення.',
   'results', 3),
  ('Як скасувати реєстрацію?',
   'Скасувати реєстрацію можна в особистому кабінеті у розділі "Мої заявки".',
   'registration', 4),
  ('Де знайти регламент змагань?',
   'Регламент кожного заходу розміщений на його сторінці у розділі "Правила та регламент".',
   'general', 5),
  ('Як зв''язатися з організаторами?',
   'Зв''язатися з організаторами можна через форму зворотного зв''язку на сторінці "Контакти".',
   'general', 6)
ON CONFLICT DO NOTHING;

INSERT INTO partners (name, website, description, type, sort_order) VALUES
  ('Міністерство молоді та спорту', 'https://mms.gov.ua',  'Державний партнер', 'partner', 1),
  ('Олімпійський комітет України',  'https://noc-ukr.org', 'Офіційний партнер', 'partner', 2),
  ('SportLife', '#', 'Генеральний спонсор', 'sponsor', 3),
  ('Nike Ukraine', '#', 'Спонсор форми',     'sponsor', 4),
  ('Sport UA',    '#', 'Медіапартнер',       'media',   5)
ON CONFLICT DO NOTHING;

-- =============================================
-- DEFAULT ADMIN USER
-- password: Admin@2025
-- =============================================
INSERT INTO users (role_id, email, password_hash, first_name, last_name, city, is_active, email_verified)
VALUES (
  1,
  'admin@sportevent.ua',
  '$2a$10$483PimSbMFXvfhthtND6lu2.WpSnfxKPznrvgusyXAwEpS0GsELGy',
  'Адміністратор',
  'Системи',
  'Київ',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;
