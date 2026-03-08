-- =============================================
-- SPORTS EVENTS MANAGEMENT SYSTEM
-- Database Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS sports_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sports_events;

-- =============================================
-- ROLES
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
  ('admin', 'Адміністратор системи'),
  ('athlete', 'Спортсмен'),
  ('team', 'Представник команди'),
  ('visitor', 'Відвідувач');

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT DEFAULT 2,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  birth_date DATE,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Україна',
  bio TEXT,
  avatar VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- =============================================
-- DISCIPLINES (Sport Types)
-- =============================================
CREATE TABLE IF NOT EXISTS disciplines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO disciplines (name, slug, description, icon) VALUES
  ('Легка атлетика', 'athletics', 'Біг, стрибки, метання', 'icon-athletics'),
  ('Плавання', 'swimming', 'Спортивне плавання', 'icon-swimming'),
  ('Футбол', 'football', 'Ігровий вид спорту', 'icon-football'),
  ('Баскетбол', 'basketball', 'Ігровий вид спорту', 'icon-basketball'),
  ('Волейбол', 'volleyball', 'Ігровий вид спорту', 'icon-volleyball'),
  ('Теніс', 'tennis', 'Великий теніс', 'icon-tennis'),
  ('Борьба', 'wrestling', 'Вільна та греко-римська боротьба', 'icon-wrestling'),
  ('Боксинг', 'boxing', 'Аматорський і профресійний боксинг', 'icon-boxing'),
  ('Велоспорт', 'cycling', 'Шосейний та трековий велоспорт', 'icon-cycling'),
  ('Гімнастика', 'gymnastics', 'Художня та спортивна гімнастика', 'icon-gymnastics');

-- =============================================
-- LOCATIONS / VENUES
-- =============================================
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Україна',
  capacity INT,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EVENTS (Sports Events)
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  discipline_id INT NOT NULL,
  location_id INT,
  created_by INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  rules TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  registration_deadline DATETIME,
  max_participants INT,
  min_age INT,
  max_age INT,
  entry_fee DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'UAH',
  status ENUM('draft', 'upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
  cover_image VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  prize_pool TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================
-- REGISTRATIONS (Participation Applications)
-- =============================================
CREATE TABLE IF NOT EXISTS registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'withdrawn', 'waitlist') DEFAULT 'pending',
  registration_number VARCHAR(50) UNIQUE,
  team_name VARCHAR(200),
  notes TEXT,
  admin_notes TEXT,
  documents VARCHAR(500),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_registration (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- RESULTS
-- =============================================
CREATE TABLE IF NOT EXISTS results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registration_id INT,
  place INT,
  result_value VARCHAR(100),
  result_unit VARCHAR(50),
  points INT DEFAULT 0,
  disqualified BOOLEAN DEFAULT FALSE,
  disqualification_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL
);

-- =============================================
-- NEWS
-- =============================================
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL,
  event_id INT,
  title VARCHAR(400) NOT NULL,
  slug VARCHAR(400) NOT NULL UNIQUE,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  cover_image VARCHAR(500),
  category ENUM('news', 'blog', 'analytics', 'announcement') DEFAULT 'news',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  views INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- =============================================
-- MEDIA FILES
-- =============================================
CREATE TABLE IF NOT EXISTS media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uploaded_by INT NOT NULL,
  event_id INT,
  news_id INT,
  file_name VARCHAR(500) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type ENUM('image', 'video', 'document', 'other') DEFAULT 'image',
  mime_type VARCHAR(100),
  file_size INT,
  title VARCHAR(300),
  alt_text VARCHAR(300),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE SET NULL
);

-- =============================================
-- SYSTEM NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- PARTNERS / SPONSORS
-- =============================================
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  logo VARCHAR(500),
  website VARCHAR(500),
  description TEXT,
  type ENUM('partner', 'sponsor', 'media') DEFAULT 'partner',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FAQ
-- =============================================
CREATE TABLE IF NOT EXISTS faq (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CONTACT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(300),
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- RANKINGS (Aggregate)
-- =============================================
CREATE TABLE IF NOT EXISTS rankings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  discipline_id INT NOT NULL,
  season_year INT NOT NULL,
  total_points INT DEFAULT 0,
  events_participated INT DEFAULT 0,
  gold_medals INT DEFAULT 0,
  silver_medals INT DEFAULT 0,
  bronze_medals INT DEFAULT 0,
  rank_position INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ranking (user_id, discipline_id, season_year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

-- =============================================
-- DEFAULT ADMIN USER
-- password: Admin@2025 (bcrypt hash)
-- =============================================
INSERT INTO users (role_id, email, password_hash, first_name, last_name, is_active, email_verified)
VALUES (
  1,
  'admin@sportevent.ua',
  '$2a$10$483PimSbMFXvfhthtND6lu2.WpSnfxKPznrvgusyXAwEpS0GsELGy',
  'Адміністратор',
  'Системи',
  TRUE,
  TRUE
);

-- =============================================
-- SAMPLE DATA
-- =============================================
INSERT INTO locations (name, address, city, capacity) VALUES
  ('НСК Олімпійський', 'вул. Велика Васильківська, 55', 'Київ', 70000),
  ('Палац спорту', 'пл. Спортивна, 1', 'Київ', 10000),
  ('Стадіон Металіст', 'вул. Плехановська, 66', 'Харків', 38633),
  ('Арена Львів', 'вул. Стрийська, 199', 'Львів', 35050);

INSERT INTO faq (question, answer, category, sort_order) VALUES
  ('Як зареєструватися на змагання?', 'Для реєстрації необхідно створити обліковий запис на сайті, увійти в особистий кабінет та подати заявку на бажаний захід.', 'registration', 1),
  ('Які документи потрібні для участі?', 'Зазвичай потрібні паспорт або інший документ, що посвідчує особу, медична довідка та страховий поліс. Конкретний перелік вказується в регламенті кожного заходу.', 'registration', 2),
  ('Як дізнатися результати змагань?', 'Результати публікуються на сторінці відповідного заходу після його завершення. Також можна переглянути результати в особистому кабінеті.', 'results', 3),
  ('Як скасувати реєстрацію?', 'Скасувати реєстрацію можна в особистому кабінеті у розділі "Мої заявки". Зверніть увагу на умови повернення стартового внеску в регламенті заходу.', 'registration', 4),
  ('Де знайти регламент змагань?', 'Регламент кожного заходу розміщений на його сторінці у розділі "Правила та регламент".', 'general', 5),
  ('Як зв\'язатися з організаторами?', 'Зв\'язатися з організаторами можна через форму зворотного зв\'язку на сторінці "Контакти" або електронною поштою, вказаною на сторінці заходу.', 'general', 6);

INSERT INTO partners (name, website, description, type, sort_order) VALUES
  ('Міністерство молоді та спорту', 'https://mms.gov.ua', 'Державний партнер', 'partner', 1),
  ('Олімпійський комітет України', 'https://noc-ukr.org', 'Офіційний партнер', 'partner', 2),
  ('SportLife', '#', 'Генеральний спонсор', 'sponsor', 3),
  ('Nike Ukraine', '#', 'Спонсор форми', 'sponsor', 4),
  ('Sport UA', '#', 'Медіапартнер', 'media', 5);
