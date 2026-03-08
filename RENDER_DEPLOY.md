# Деплой СпортUA на Render.com

> **Render** — хмарна платформа для розгортання веб-додатків.
> Підтримує Node.js, автоматичний деплой із GitHub і вбудовану PostgreSQL базу даних.
> Free-tier: необмежено (сайт), PostgreSQL — 1 ГБ / 90 днів безкоштовно.

---

## Що таке Render

| Особливість | Деталі |
|---|---|
| Деплой | Автоматично при кожному `git push` до GitHub |
| База даних | PostgreSQL (вбудована, не MySQL) |
| Середовище | Node.js 18+ |
| SSL | Автоматично (HTTPS із коробки) |
| URL | `https://ваш-проект.onrender.com` |
| Файлова система | **Ephemeral** — завантажені файли скидаються при рестарті |

---

## Передумови

- Обліковий запис на [github.com](https://github.com)
- Обліковий запис на [render.com](https://render.com) (реєстрація через GitHub)
- Git встановлено локально

---

## Крок 1 — Підготовка репозиторію GitHub

### 1.1 Ініціалізація Git

```bash
cd "D:\Строяк\Диплом"
git init
git add .
git commit -m "Initial commit: СпортUA"
```

### 1.2 Створення репозиторію на GitHub

1. Відкрийте [github.com/new](https://github.com/new)
2. Назва: `sportevent-ua` (або будь-яка інша)
3. Тип: **Private** (рекомендовано для дипломного проєкту)
4. **Не** додавайте README, .gitignore, license — вони вже є в проєкті
5. Натисніть **Create repository**

### 1.3 Завантаження коду на GitHub

```bash
git remote add origin https://github.com/ВАШ_ЛОГІН/sportevent-ua.git
git branch -M main
git push -u origin main
```

> ⚠️ Файл `.env` **не** потрапить до GitHub (він у `.gitignore`) — це правильно.
> Змінні середовища вводяться безпосередньо в Render Dashboard.

---

## Крок 2 — Створення PostgreSQL бази на Render

1. Зайдіть на [dashboard.render.com](https://dashboard.render.com)
2. Натисніть **New +** → **PostgreSQL**
3. Заповніть форму:

   | Поле | Значення |
   |---|---|
   | Name | `sportevent-db` |
   | Database | `sports_events` |
   | User | `sportevent` |
   | Region | `Frankfurt (EU Central)` |
   | Plan | **Free** |

4. Натисніть **Create Database**
5. Зачекайте 1–2 хвилини — база створиться
6. Скопіюйте **Internal Database URL** (знадобиться на кроці 3)

---

## Крок 3 — Створення Web Service на Render

1. Натисніть **New +** → **Web Service**
2. Оберіть **Connect a repository** → знайдіть `sportevent-ua`
3. Заповніть налаштування:

   | Поле | Значення |
   |---|---|
   | Name | `sportevent-ua` |
   | Region | `Frankfurt (EU Central)` ← той самий, що й БД |
   | Branch | `main` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | **Free** |

4. Прокрутіть вниз до **Environment Variables** → додайте:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Internal Database URL із кроку 2)* |
   | `JWT_SECRET` | *(будь-який довгий рядок, наприклад: `my_secret_2026_sportuа_jwt`)* |
   | `SESSION_SECRET` | *(будь-який довгий рядок)* |
   | `APP_URL` | `https://sportevent-ua.onrender.com` |

5. Натисніть **Create Web Service**
6. Render почне білд — зачекайте 3–5 хвилин

---

## Крок 4 — Завантаження схеми бази даних

Після того як сервіс запустився, потрібно **один раз** створити таблиці у PostgreSQL.

### Варіант А — через Render Shell (рекомендовано)

1. Відкрийте ваш Web Service у Render Dashboard
2. Вкладка **Shell**
3. Виконайте:

```bash
node render-db/migrate.js
```

Очікуваний вивід:
```
✅ Connected to PostgreSQL
✅ Schema applied successfully
📊 Tables in database: 14
🏅 Disciplines: Легка атлетика, Плавання, Футбол, ...
✅ Migration complete!
```

### Варіант Б — через psql локально

```bash
# Встановіть psql (PostgreSQL client)
# Отримайте External Database URL з Render Dashboard → вкладка Info
psql "postgresql://sportevent:PASSWORD@HOST/sports_events?sslmode=require" \
  -f render-db/schema.pg.sql
```

### Варіант В — через pgAdmin

1. Завантажте [pgAdmin](https://www.pgadmin.org/)
2. Додайте сервер: Host, Port, User, Password із Render Dashboard → **Connection**
3. Відкрийте Query Tool
4. Завантажте файл `render-db/schema.pg.sql` та виконайте (F5)

---

## Крок 5 — Перевірка

1. Відкрийте `https://sportevent-ua.onrender.com` у браузері
2. Сайт повинен завантажитись
3. Спробуйте увійти як адміністратор:
   - Email: `admin@sportevent.ua`
   - Пароль: `Admin@2025`
4. Перевірте `/admin` — адмін-панель повинна відображати дашборд

---

## Крок 6 — Автодеплой при змінах

Після налаштування кожен `git push` автоматично перезапускає сервіс:

```bash
# Внесли зміни в код
git add .
git commit -m "Fix: опис змін"
git push origin main
# Render автоматично починає новий деплой (1–3 хвилини)
```

---

## Важливі обмеження Free-tier

| Обмеження | Деталь |
|---|---|
| **Sleep після 15 хв. бездіяльності** | Перший запит може займати ~30 сек. |
| **PostgreSQL 90 днів** | Після 90 днів БД видаляється. Заздалегідь зробіть `pg_dump`. |
| **Ephemeral filesystem** | Завантажені зображення (`public/images/uploads/`) скидаються при рестарті. Для постійного зберігання потрібен Cloudinary або AWS S3. |
| **Bandwidth** | 100 ГБ/міс — більш ніж достатньо для дипломного проєкту. |

---

## Резервне копіювання БД

Перед закінченням 90-денного терміну зробіть дамп:

```bash
# Отримайте External Database URL з Render Dashboard
pg_dump "postgresql://sportevent:PASSWORD@HOST/sports_events?sslmode=require" \
  --no-owner \
  --no-acl \
  -f backup_render_$(date +%Y-%m-%d).sql
```

---

## Локальна розробка (без змін)

Проєкт автоматично визначає режим БД:

```
DATABASE_URL не задано  →  MySQL (XAMPP, локально)
DATABASE_URL задано     →  PostgreSQL (Render)
```

Локально все працює як раніше через XAMPP.

---

## Структура доданих файлів

```
Диплом/
├── .gitignore              # Виключає node_modules, .env, uploads
├── render.yaml             # IaC конфіг для Render (опціонально)
├── render-db/
│   ├── schema.pg.sql       # PostgreSQL схема (всі таблиці)
│   └── migrate.js          # Скрипт для створення таблиць
└── config/
    └── database.js         # Адаптер: MySQL (dev) ↔ PostgreSQL (prod)
```
