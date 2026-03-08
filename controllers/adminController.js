const User = require('../models/User');
const Event = require('../models/Event');
const News = require('../models/News');
const Registration = require('../models/Registration');
const Result = require('../models/Result');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// =============================================
// DASHBOARD STATS
// =============================================
async function getDashboardStats(req, res) {
  try {
    const [userStats, eventStats] = await Promise.all([
      User.getStats(),
      Event.getStats()
    ]);

    const [[regStats]] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved
      FROM registrations
    `);

    const [[newsStats]] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published
      FROM news
    `);

    const [recentRegistrations] = await pool.execute(`
      SELECT r.id, r.status, r.registered_at,
             u.first_name, u.last_name, e.title as event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registered_at DESC LIMIT 10
    `);

    const [recentUsers] = await pool.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.created_at, r.name as role_name
      FROM users u JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC LIMIT 5
    `);

    const [upcomingEvents] = await pool.execute(`
      SELECT e.id, e.title, e.slug, e.start_date, e.status,
             d.name as discipline_name, l.city as location_city,
             COUNT(reg.id) as registrations_count
      FROM events e
      JOIN disciplines d ON e.discipline_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN registrations reg ON reg.event_id = e.id AND reg.status = 'approved'
      WHERE e.start_date >= NOW()
      GROUP BY e.id, e.title, e.slug, e.start_date, e.status, d.name, l.city
      ORDER BY e.start_date ASC LIMIT 5
    `);

    const [[{ contacts_count }]] = await pool.execute(
      "SELECT COUNT(*) as contacts_count FROM contact_messages WHERE status NOT IN ('replied','closed')"
    );

    // Recent events (by created_at)
    const [recentEvents] = await pool.execute(`
      SELECT e.id, e.title, e.created_at
      FROM events e ORDER BY e.created_at DESC LIMIT 5
    `);

    // Recent news (published)
    const [recentNews] = await pool.execute(`
      SELECT n.id, n.title, n.created_at
      FROM news n WHERE n.status = 'published' ORDER BY n.created_at DESC LIMIT 5
    `);

    // Build unified activity feed
    const roleLabels = { admin: 'адміністратор', athlete: 'спортсмен', team: 'команда', coach: 'тренер' };
    const statusLabels = { pending: 'на розгляді', approved: 'підтверджено', rejected: 'відхилено' };

    const recent_activity = [
      ...recentRegistrations.slice(0, 6).map(r => ({
        type: 'registration',
        message: `Реєстрація ${r.first_name} ${r.last_name} на «${r.event_title}» — ${statusLabels[r.status] || r.status}`,
        created_at: r.registered_at
      })),
      ...recentUsers.slice(0, 4).map(u => ({
        type: 'user',
        message: `Новий користувач: ${u.first_name} ${u.last_name} (${roleLabels[u.role_name] || u.role_name})`,
        created_at: u.created_at
      })),
      ...recentEvents.slice(0, 4).map(e => ({
        type: 'event',
        message: `Додано захід: «${e.title}»`,
        created_at: e.created_at
      })),
      ...recentNews.slice(0, 3).map(n => ({
        type: 'news',
        message: `Опубліковано новину: «${n.title}»`,
        created_at: n.created_at
      }))
    ]
      .filter(a => a.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({
      users: userStats,
      events: eventStats,
      registrations: regStats,
      news: newsStats,
      contacts_count,
      recentRegistrations,
      recentUsers,
      upcomingEvents,
      recent_activity
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Помилка отримання статистики' });
  }
}

// =============================================
// USER MANAGEMENT
// =============================================
async function getUsers(req, res) {
  try {
    const { page = 1, limit = 20, search = '', role = '', is_blocked = '' } = req.query;
    const result = await User.getAll({ page: parseInt(page), limit: parseInt(limit), search, role, is_blocked });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання користувачів' });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

    const [regHistory] = await pool.execute(
      `SELECT r.*, e.title as event_title, e.start_date FROM registrations r
       JOIN events e ON r.event_id = e.id WHERE r.user_id = ? ORDER BY r.registered_at DESC`,
      [req.params.id]
    );

    const { password_hash, ...safeUser } = user;

    // For team accounts — fetch athletes who registered under this team name
    let teamMembers = [];
    if (user.role_name === 'team' && user.first_name) {
      const [members] = await pool.execute(
        `SELECT DISTINCT u.id, u.first_name, u.last_name, u.city, u.email,
                COUNT(r.id) as shared_events
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         JOIN roles ro ON u.role_id = ro.id
         WHERE r.team_name = ? AND u.id != ? AND ro.name = 'athlete'
         GROUP BY u.id, u.first_name, u.last_name, u.city, u.email
         ORDER BY u.first_name, u.last_name`,
        [user.first_name, req.params.id]
      );
      teamMembers = members;
    }

    res.json({ user: safeUser, registrations: regHistory, teamMembers });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання користувача' });
  }
}

async function updateUser(req, res) {
  try {
    await User.update(req.params.id, req.body);
    if (req.body.role_id) await User.updateRole(req.params.id, req.body.role_id);
    res.json({ message: 'Користувача оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
}

async function toggleUserBlock(req, res) {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: 'Не можна заблокувати власний акаунт' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Користувача не знайдено' });
    await User.toggleBlock(req.params.id);
    const nowBlocked = !target.is_blocked;
    const displayName = target.first_name || target.email;
    // Send email notification (non-blocking)
    if (nowBlocked) {
      emailService.sendBanNotification(target.email, displayName).catch(() => {});
    } else {
      emailService.sendUnbanNotification(target.email, displayName).catch(() => {});
    }
    res.json({ message: nowBlocked ? 'Користувача заблоковано' : 'Користувача розблоковано', is_blocked: nowBlocked });
  } catch (err) {
    res.status(500).json({ error: 'Помилка зміни статусу' });
  }
}

async function banByEmail(req, res) {
  try {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Вкажіть email' });
    const target = await User.findByEmail(email);
    if (!target) return res.status(404).json({ error: 'Користувача з таким email не знайдено' });
    if (target.id == req.user.id) return res.status(400).json({ error: 'Не можна заблокувати власний акаунт' });
    const nowBlocked = !target.is_blocked;
    await User.toggleBlock(target.id);
    const displayName = target.first_name || target.email;
    if (nowBlocked) {
      emailService.sendBanNotification(target.email, displayName, reason).catch(() => {});
    } else {
      emailService.sendUnbanNotification(target.email, displayName).catch(() => {});
    }
    res.json({
      message: nowBlocked ? `Акаунт ${email} заблоковано` : `Акаунт ${email} розблоковано`,
      is_blocked: nowBlocked,
      user: { id: target.id, email: target.email, first_name: target.first_name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка операції' });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: 'Не можна видалити власний акаунт' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Користувача не знайдено' });
    await User.delete(req.params.id);
    emailService.sendDeleteNotification(target.email, target.first_name || target.email).catch(() => {});
    res.json({ message: 'Користувача видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення' });
  }
}

// =============================================
// EVENT MANAGEMENT
// =============================================
async function getEvents(req, res) {
  try {
    const { page = 1, limit = 20, search = '', discipline = '', status = '' } = req.query;
    const result = await Event.getAll({ page: parseInt(page), limit: parseInt(limit), search, discipline, status });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання заходів' });
  }
}

async function resolveLocation(body) {
  const { location_city, location_address } = body;
  if (!location_city) return;
  const [existing] = await pool.execute(
    'SELECT id FROM locations WHERE city = ? AND (address = ? OR (address IS NULL AND ? IS NULL))',
    [location_city, location_address || null, location_address || null]
  );
  if (existing.length) {
    body.location_id = existing[0].id;
  } else {
    const [result] = await pool.execute(
      'INSERT INTO locations (name, city, address, country) VALUES (?, ?, ?, ?)',
      [location_city, location_city, location_address || null, 'Україна']
    );
    body.location_id = result.insertId;
  }
}

async function createEvent(req, res) {
  try {
    req.body.created_by = req.user.id;
    await resolveLocation(req.body);
    const id = await Event.create(req.body);
    res.status(201).json({ message: 'Захід створено', id });
  } catch (err) {
    console.error('Create event error:', err.message);
    console.error('Create event stack:', err.stack);
    console.error('Create event body:', JSON.stringify(req.body));
    res.status(500).json({ error: 'Помилка створення заходу', detail: err.message });
  }
}

async function updateEvent(req, res) {
  try {
    await resolveLocation(req.body);
    await Event.update(req.params.id, req.body);
    res.json({ message: 'Захід оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення заходу' });
  }
}

async function deleteEvent(req, res) {
  try {
    await Event.delete(req.params.id);
    res.json({ message: 'Захід видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення заходу' });
  }
}

// =============================================
// NEWS MANAGEMENT
// =============================================
async function getNews(req, res) {
  try {
    const { page = 1, limit = 20, status = '', category = '', search = '' } = req.query;
    const result = await News.getAll({ page: parseInt(page), limit: parseInt(limit), status, category, search });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання новин' });
  }
}

async function createNews(req, res) {
  try {
    req.body.author_id = req.user.id;
    if (req.file) req.body.cover_image = `/images/uploads/${req.file.filename}`;
    const id = await News.create(req.body);
    res.status(201).json({ message: 'Новину створено', id });
  } catch (err) {
    res.status(500).json({ error: 'Помилка створення новини' });
  }
}

async function updateNews(req, res) {
  try {
    if (req.file) req.body.cover_image = `/images/uploads/${req.file.filename}`;
    await News.update(req.params.id, req.body);
    res.json({ message: 'Новину оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення новини' });
  }
}

async function deleteNews(req, res) {
  try {
    await News.delete(req.params.id);
    res.json({ message: 'Новину видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення новини' });
  }
}

// =============================================
// REGISTRATIONS MANAGEMENT
// =============================================
async function getRegistrations(req, res) {
  try {
    const { page = 1, limit = 20, status = '', event_id = '' } = req.query;
    const result = await Registration.getAll({ page: parseInt(page), limit: parseInt(limit), status, event_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання заявок' });
  }
}

async function updateRegistrationStatus(req, res) {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'waitlist'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Невірний статус' });
    }
    await Registration.updateStatus(req.params.id, status, admin_notes);
    res.json({ message: 'Статус заявки оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення статусу' });
  }
}

// =============================================
// RESULTS MANAGEMENT
// =============================================
async function getResults(req, res) {
  try {
    const { page = 1, limit = 20, search = '', event_id = '', place = '' } = req.query;
    const result = await Result.getAll({
      page: parseInt(page), limit: parseInt(limit), search, event_id, place
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання результатів' });
  }
}

async function addResult(req, res) {
  try {
    const id = await Result.createOrUpdate(req.body);
    res.status(201).json({ message: 'Результат збережено', id });
  } catch (err) {
    console.error('Add result error:', err);
    res.status(500).json({ error: 'Помилка збереження результату' });
  }
}

async function updateResult(req, res) {
  try {
    await Result.update(req.params.id, req.body);
    res.json({ message: 'Результат оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення результату' });
  }
}

async function deleteResult(req, res) {
  try {
    await Result.delete(req.params.id);
    res.json({ message: 'Результат видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення результату' });
  }
}

// =============================================
// DISCIPLINES
// =============================================
async function getDisciplines(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM disciplines WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання дисциплін' });
  }
}

async function createDiscipline(req, res) {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await pool.execute(
      'INSERT INTO disciplines (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    res.status(201).json({ message: 'Дисципліну додано' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка додавання дисципліни' });
  }
}

// =============================================
// LOCATIONS
// =============================================
async function getLocations(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM locations ORDER BY city, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання локацій' });
  }
}

async function createLocation(req, res) {
  try {
    const { name, address, city, country, capacity, description } = req.body;
    await pool.execute(
      'INSERT INTO locations (name, address, city, country, capacity, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, address || null, city || null, country || 'Україна', capacity || null, description || null]
    );
    res.status(201).json({ message: 'Локацію додано' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка додавання локації' });
  }
}

// =============================================
// REPORTS — структура відповідає admin/reports.html
// =============================================
async function getReports(req, res) {
  try {
    const { period = 'all' } = req.query;
    const intervalMap = { month: 1, quarter: 3, year: 12 };
    const months = intervalMap[period];
    // PostgreSQL uses NOW() - INTERVAL '…', MySQL uses DATE_SUB(NOW(), INTERVAL … MONTH)
    const dateSub = pool.isPg
      ? (n) => `NOW() - INTERVAL '${n} months'`
      : (n) => `DATE_SUB(NOW(), INTERVAL ${n} MONTH)`;
    const dateFilter = months ? `>= ${dateSub(months)}` : 'IS NOT NULL';

    // Run stats subqueries individually to avoid PostgreSQL bare-SELECT issues
    const statsQueries = [
      { key: 'total_events',      sql: `SELECT COUNT(*) as v FROM events ${months ? 'WHERE start_date ' + dateFilter : ''}` },
      { key: 'active_events',     sql: `SELECT COUNT(*) as v FROM events WHERE status IN ('upcoming','registration_open','ongoing')` },
      { key: 'finished_events',   sql: `SELECT COUNT(*) as v FROM events WHERE status = 'completed'` },
      { key: 'total_participants',sql: `SELECT COUNT(*) as v FROM registrations WHERE status='approved' ${months ? 'AND registered_at ' + dateFilter : ''}` },
      { key: 'total_users',       sql: `SELECT COUNT(*) as v FROM users` },
      { key: 'new_users',         sql: `SELECT COUNT(*) as v FROM users WHERE created_at ${dateFilter}` },
      { key: 'active_users',      sql: `SELECT COUNT(*) as v FROM users WHERE is_active = TRUE AND is_blocked = FALSE` },
      { key: 'blocked_users',     sql: `SELECT COUNT(*) as v FROM users WHERE is_blocked = TRUE` },
      { key: 'media_count',       sql: `SELECT COUNT(*) as v FROM media` },
      { key: 'contacts_count',    sql: `SELECT COUNT(*) as v FROM contact_messages` },
    ];
    const stats = {};
    for (const q of statsQueries) {
      const [[row]] = await pool.execute(q.sql);
      stats[q.key] = row ? (row.v ?? row.count ?? 0) : 0;
    }

    const [[regStats]] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
      FROM registrations
      ${months ? 'WHERE registered_at ' + dateFilter : ''}
    `);

    const [[newsStats]] = await pool.execute(`
      SELECT
        SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft
      FROM news
    `);

    const [byDiscipline] = await pool.execute(`
      SELECT d.name as discipline_name, COUNT(e.id) as event_count
      FROM disciplines d
      LEFT JOIN events e ON e.discipline_id = d.id ${months ? 'AND e.start_date ' + dateFilter : ''}
      WHERE d.is_active = TRUE
      GROUP BY d.id, d.name ORDER BY event_count DESC
    `);

    const monthsBack = months || 120;
    // DATE_FORMAT / GROUP BY alias → PostgreSQL needs TO_CHAR + expression in GROUP BY
    const byMonthSql = pool.isPg
      ? `SELECT TO_CHAR(registered_at, 'YYYY-MM')    as month,
                TO_CHAR(registered_at, 'MM/YYYY')    as month_label,
                COUNT(*)                             as count
         FROM registrations
         WHERE registered_at >= NOW() - INTERVAL '${monthsBack} months'
         GROUP BY TO_CHAR(registered_at, 'YYYY-MM'), TO_CHAR(registered_at, 'MM/YYYY')
         ORDER BY 1 ASC`
      : `SELECT DATE_FORMAT(registered_at, '%Y-%m')  as month,
                DATE_FORMAT(registered_at, '%m/%Y')  as month_label,
                COUNT(*)                             as count
         FROM registrations
         WHERE registered_at >= DATE_SUB(NOW(), INTERVAL ${monthsBack} MONTH)
         GROUP BY month ORDER BY month ASC`;
    const [byMonth] = await pool.execute(byMonthSql);

    const [topUsers] = await pool.execute(`
      SELECT u.id, u.first_name, u.last_name, u.city,
             COALESCE(SUM(res.points), 0) as total_points,
             COUNT(res.id) as result_count
      FROM users u
      LEFT JOIN results res ON res.user_id = u.id
      ${months ? 'LEFT JOIN events e ON res.event_id = e.id AND e.start_date ' + dateFilter : ''}
      GROUP BY u.id, u.first_name, u.last_name, u.city
      HAVING COALESCE(SUM(res.points), 0) > 0
      ORDER BY total_points DESC LIMIT 10
    `);

    const [topEvents] = await pool.execute(`
      SELECT e.id, e.title, COUNT(r.id) as reg_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'approved' ${months ? 'AND r.registered_at ' + dateFilter : ''}
      ${months ? 'WHERE e.start_date ' + dateFilter : ''}
      GROUP BY e.id, e.title ORDER BY reg_count DESC LIMIT 8
    `);

    res.json({
      stats,
      registrations: regStats,
      news: newsStats,
      byDiscipline,
      byMonth,
      topUsers,
      topEvents,
      period
    });
  } catch (err) {
    console.error('Reports error message:', err.message);
    console.error('Reports error stack:', err.stack);
    res.status(500).json({ error: 'Помилка формування звіту', detail: err.message });
  }
}

// =============================================
// CONTACT MESSAGES — з пагінацією та фільтрами
// =============================================
async function getContactMessages(req, res) {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND status = ?'; params.push(status); }
    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const [rows] = await pool.execute(
      `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM contact_messages ${where}`, params
    );

    const [[{ unread_count }]] = await pool.execute(
      "SELECT COUNT(*) as unread_count FROM contact_messages WHERE status = 'new'"
    );

    res.json({
      contacts: rows,
      total,
      unread_count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання повідомлень' });
  }
}

async function replyContactMessage(req, res) {
  try {
    const { reply, admin_reply, status } = req.body;
    const replyText = reply || admin_reply || null;
    const newStatus = status || (replyText ? 'replied' : 'read');
    await pool.execute(
      'UPDATE contact_messages SET admin_reply = ?, status = ? WHERE id = ?',
      [replyText, newStatus, req.params.id]
    );
    res.json({ message: 'Відповідь збережено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка збереження відповіді' });
  }
}

async function deleteContact(req, res) {
  try {
    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Повідомлення видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення повідомлення' });
  }
}

// =============================================
// MEDIA — з пагінацією та фільтрами
// =============================================
async function getMedia(req, res) {
  try {
    const { page = 1, limit = 24, search = '', type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];

    if (type === 'gallery') {
      where += " AND m.event_id IS NULL AND m.news_id IS NULL AND m.file_type = 'image'";
    } else if (type === 'event') {
      where += ' AND m.event_id IS NOT NULL';
    } else if (type === 'news') {
      where += ' AND m.news_id IS NOT NULL';
    } else if (type === 'other') {
      where += " AND m.file_type != 'image'";
    }

    if (search) {
      where += ' AND (m.title LIKE ? OR m.file_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT m.*, u.first_name, u.last_name FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM media m ${where}`, params
    );

    const media = rows.map(m => ({ ...m, url: m.file_path }));

    res.json({
      media,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання медіафайлів' });
  }
}

async function uploadMedia(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });
    const { event_id, news_id, title, alt_text } = req.body;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
                     req.file.mimetype.startsWith('video/') ? 'video' : 'document';
    await pool.execute(
      `INSERT INTO media (uploaded_by, event_id, news_id, file_name, file_path, file_type, mime_type, file_size, title, alt_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, event_id || null, news_id || null, req.file.originalname,
       `/images/uploads/${req.file.filename}`, fileType, req.file.mimetype,
       req.file.size, title || null, alt_text || null]
    );
    res.status(201).json({
      message: 'Файл завантажено',
      path: `/images/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка завантаження файлу' });
  }
}

async function deleteMedia(req, res) {
  try {
    const [[row]] = await pool.execute('SELECT file_path FROM media WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Файл не знайдено' });
    await pool.execute('DELETE FROM media WHERE id = ?', [req.params.id]);
    // Delete physical file
    const filePath = path.join(__dirname, '..', 'public', row.file_path);
    fs.unlink(filePath, () => {}); // ignore error if file missing
    res.json({ message: 'Медіафайл видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення медіафайлу' });
  }
}

async function cropMedia(req, res) {
  try {
    const { x, y, width, height } = req.body;
    if ([x, y, width, height].some(v => v === undefined || v === null)) {
      return res.status(400).json({ error: 'Невірні параметри обрізання' });
    }
    const [[row]] = await pool.execute('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Файл не знайдено' });
    if (row.file_type !== 'image') return res.status(400).json({ error: 'Можна обрізати лише зображення' });

    const filePath = path.join(__dirname, '..', 'public', row.file_path);
    const cropX = Math.max(0, Math.round(Number(x)));
    const cropY = Math.max(0, Math.round(Number(y)));
    const cropW = Math.max(1, Math.round(Number(width)));
    const cropH = Math.max(1, Math.round(Number(height)));

    await sharp(filePath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .jpeg({ quality: 90 })
      .toFile(filePath + '.tmp');

    fs.renameSync(filePath + '.tmp', filePath);

    // Update file_size in DB
    const stat = fs.statSync(filePath);
    await pool.execute('UPDATE media SET file_size = ? WHERE id = ?', [stat.size, req.params.id]);

    res.json({ message: 'Зображення обрізано', path: row.file_path });
  } catch (err) {
    console.error('cropMedia error:', err);
    res.status(500).json({ error: 'Помилка обрізання зображення' });
  }
}

module.exports = {
  getDashboardStats,
  getUsers, getUser, updateUser, toggleUserBlock, banByEmail, deleteUser,
  getEvents, createEvent, updateEvent, deleteEvent,
  getNews, createNews, updateNews, deleteNews,
  getRegistrations, updateRegistrationStatus,
  getResults, addResult, updateResult, deleteResult,
  getDisciplines, createDiscipline,
  getLocations, createLocation,
  getReports,
  getContactMessages, replyContactMessage, deleteContact,
  getMedia, uploadMedia, deleteMedia, cropMedia
};
