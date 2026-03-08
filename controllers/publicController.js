const Event = require('../models/Event');
const News = require('../models/News');
const { pool } = require('../config/database');

async function getPublicEvents(req, res) {
  try {
    const { page = 1, limit = 12, discipline = '', status = '', search = '', month = '' } = req.query;
    let statusFilter = status || '';
    const result = await Event.getAll({
      page: parseInt(page), limit: parseInt(limit),
      search, discipline, status: statusFilter
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання заходів' });
  }
}

async function getEventBySlug(req, res) {
  try {
    const event = await Event.findBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Захід не знайдено' });

    const [participants, results] = await Promise.all([
      Event.getParticipants(event.id),
      Event.getResults(event.id)
    ]);

    // Check if current user is registered
    let userRegistration = null;
    if (req.user) {
      const Registration = require('../models/Registration');
      userRegistration = await Registration.findByUserAndEvent(req.user.id, event.id);
    }

    res.json({ event, participants, results, userRegistration });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання заходу' });
  }
}

async function getPublicNews(req, res) {
  try {
    const { page = 1, limit = 9, category = '', search = '' } = req.query;
    const result = await News.getAll({
      page: parseInt(page), limit: parseInt(limit),
      category, status: 'published', search
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання новин' });
  }
}

async function getNewsBySlug(req, res) {
  try {
    const article = await News.findBySlug(req.params.slug);
    if (!article || article.status !== 'published') {
      return res.status(404).json({ error: 'Статтю не знайдено' });
    }

    const [related] = await pool.execute(
      `SELECT id, title, slug, cover_image, published_at, category
       FROM news WHERE status = 'published' AND id != ? AND category = ?
       ORDER BY published_at DESC LIMIT 3`,
      [article.id, article.category]
    );

    res.json({ article, related });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання статті' });
  }
}

async function getDisciplines(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM disciplines WHERE is_active = TRUE ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання дисциплін' });
  }
}

async function getRankings(req, res) {
  try {
    const { discipline = '', year = new Date().getFullYear(), limit = 50 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (discipline) { where += ' AND d.slug = ?'; params.push(discipline); }
    if (year) { where += ' AND EXTRACT(YEAR FROM e.start_date) = ?'; params.push(parseInt(year)); }

    const [rows] = await pool.execute(
      `SELECT
         u.id as user_id, u.first_name, u.last_name, u.city, u.avatar,
         ro.name as role_name,
         MAX(reg.team_name) as team_name,
         d.id as discipline_id, d.name as discipline_name, d.slug as discipline_slug,
         SUM(COALESCE(res.points, 0)) as total_points,
         COUNT(res.id) as events_count,
         SUM(CASE WHEN res.place = 1 THEN 1 ELSE 0 END) as gold_medals,
         SUM(CASE WHEN res.place = 2 THEN 1 ELSE 0 END) as silver_medals,
         SUM(CASE WHEN res.place = 3 THEN 1 ELSE 0 END) as bronze_medals
       FROM results res
       JOIN users u ON res.user_id = u.id
       JOIN roles ro ON u.role_id = ro.id
       LEFT JOIN registrations reg ON reg.event_id = res.event_id AND reg.user_id = res.user_id
       JOIN events e ON res.event_id = e.id
       JOIN disciplines d ON e.discipline_id = d.id
       ${where}
       GROUP BY u.id, u.first_name, u.last_name, u.city, u.avatar,
                ro.name, d.id, d.name, d.slug
       ORDER BY total_points DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    rows.forEach((row, index) => { row.rank_position = index + 1; });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання рейтингу' });
  }
}

async function getCalendarEvents(req, res) {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    let where = 'WHERE EXTRACT(YEAR FROM start_date) = ?';
    const params = [parseInt(year)];
    if (month) { where += ' AND EXTRACT(MONTH FROM start_date) = ?'; params.push(parseInt(month)); }

    const [rows] = await pool.execute(
      `SELECT e.id, e.title, e.slug, e.start_date, e.end_date, e.status,
              d.name as discipline_name, d.slug as discipline_slug,
              l.city as location_city
       FROM events e
       JOIN disciplines d ON e.discipline_id = d.id
       LEFT JOIN locations l ON e.location_id = l.id
       ${where} ORDER BY start_date ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання календаря' });
  }
}

async function getGallery(req, res) {
  try {
    const { page = 1, limit = 24, event_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = "WHERE m.file_type = 'image' AND m.is_public = TRUE";
    const params = [];
    if (event_id) { where += ' AND m.event_id = ?'; params.push(event_id); }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM media m ${where}`, params
    );
    const [rows] = await pool.execute(
      `SELECT m.*, e.title as event_title, e.slug as event_slug,
              u.first_name as uploader_first, u.last_name as uploader_last
       FROM media m
       LEFT JOIN events e ON m.event_id = e.id
       JOIN users u ON m.uploaded_by = u.id
       ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ items: rows, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання галереї' });
  }
}

async function getPartners(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM partners WHERE is_active = TRUE ORDER BY sort_order, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання партнерів' });
  }
}

async function getFAQ(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM faq WHERE is_active = TRUE ORDER BY sort_order, id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання FAQ' });
  }
}

async function submitContact(req, res) {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
    }
    await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, subject || null, message]
    );
    res.json({ message: 'Повідомлення відправлено. Ми зв\'яжемося з вами найближчим часом.' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка відправки повідомлення' });
  }
}

async function getHomeData(req, res) {
  try {
    const [featuredEvents] = await pool.execute(`
      SELECT e.id, e.title, e.slug, e.start_date, e.cover_image, e.status, e.entry_fee,
             d.name as discipline_name, d.slug as discipline_slug,
             l.city as location_city,
             (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status='approved') as participants_count
      FROM events e
      JOIN disciplines d ON e.discipline_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.is_featured = TRUE AND e.status NOT IN ('draft','cancelled')
      ORDER BY e.start_date ASC LIMIT 6
    `);

    const [latestNews] = await pool.execute(`
      SELECT id, title, slug, excerpt, cover_image, category, published_at
      FROM news WHERE status = 'published'
      ORDER BY published_at DESC LIMIT 3
    `);

    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM events WHERE status NOT IN ('draft','cancelled')) as total_events,
        (SELECT COUNT(*) FROM users) as total_athletes,
        (SELECT COUNT(*) FROM registrations WHERE status IN ('approved','pending')) as total_registrations,
        (SELECT COUNT(*) FROM disciplines WHERE is_active=TRUE) as total_disciplines,
        (SELECT COUNT(*) FROM media WHERE file_type='image') as total_photos
    `);

    res.json({ featuredEvents, latestNews, stats });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання даних' });
  }
}

module.exports = {
  getPublicEvents, getEventBySlug,
  getPublicNews, getNewsBySlug,
  getDisciplines, getRankings,
  getCalendarEvents, getGallery,
  getPartners, getFAQ, submitContact,
  getHomeData
};
