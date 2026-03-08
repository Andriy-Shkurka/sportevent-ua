const { pool } = require('../config/database');

class Event {
  static async getAll({ page = 1, limit = 12, search = '', discipline = '', status = '', featured = false } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND e.title LIKE ?';
      params.push(`%${search}%`);
    }
    if (discipline) {
      where += ' AND d.slug = ?';
      params.push(discipline);
    }
    if (status) {
      where += ' AND e.status = ?';
      params.push(status);
    }
    if (featured) {
      where += ' AND e.is_featured = TRUE';
    }

    const [rows] = await pool.execute(
      `SELECT e.*, d.name as discipline_name, d.slug as discipline_slug,
              l.name as location_name, l.city as location_city,
              u.first_name as creator_first, u.last_name as creator_last,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'approved') as participants_count
       FROM events e
       JOIN disciplines d ON e.discipline_id = d.id
       LEFT JOIN locations l ON e.location_id = l.id
       JOIN users u ON e.created_by = u.id
       ${where} ORDER BY e.start_date ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM events e
       JOIN disciplines d ON e.discipline_id = d.id
       ${where}`,
      params
    );

    return { events: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, d.name as discipline_name, d.slug as discipline_slug,
              l.name as location_name, l.address as location_address, l.city as location_city,
              u.first_name as creator_first, u.last_name as creator_last
       FROM events e
       JOIN disciplines d ON e.discipline_id = d.id
       LEFT JOIN locations l ON e.location_id = l.id
       JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findBySlug(slug) {
    const [rows] = await pool.execute(
      `SELECT e.*, d.name as discipline_name, d.slug as discipline_slug,
              l.name as location_name, l.address as location_address, l.city as location_city, l.capacity as location_capacity,
              u.first_name as creator_first, u.last_name as creator_last
       FROM events e
       JOIN disciplines d ON e.discipline_id = d.id
       LEFT JOIN locations l ON e.location_id = l.id
       JOIN users u ON e.created_by = u.id
       WHERE e.slug = ?`,
      [slug]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const slug = await Event.generateSlug(data.title);
    const [result] = await pool.execute(
      `INSERT INTO events (discipline_id, location_id, created_by, title, slug, description, rules,
       start_date, end_date, registration_deadline, max_participants, min_age, max_age,
       entry_fee, currency, status, cover_image, is_featured, prize_pool)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.discipline_id, data.location_id || null, data.created_by, data.title, slug,
       data.description || null, data.rules || null, data.start_date, data.end_date,
       data.registration_deadline || null, data.max_participants || null,
       data.min_age || null, data.max_age || null,
       data.entry_fee || 0, data.currency || 'UAH',
       data.status || 'draft', data.cover_image || null,
       data.is_featured || false, data.prize_pool || null]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const allowed = ['discipline_id', 'location_id', 'title', 'description', 'rules',
      'start_date', 'end_date', 'registration_deadline', 'max_participants',
      'min_age', 'max_age', 'entry_fee', 'currency', 'status', 'cover_image',
      'is_featured', 'prize_pool'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return false;
    values.push(id);
    await pool.execute(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
  }

  static async getParticipants(eventId) {
    const [rows] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name, u.email, u.city, u.avatar
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?
       ORDER BY r.registered_at ASC`,
      [eventId]
    );
    return rows;
  }

  static async getResults(eventId) {
    const [rows] = await pool.execute(
      `SELECT res.*, u.first_name, u.last_name, u.city, u.avatar
       FROM results res
       JOIN users u ON res.user_id = u.id
       WHERE res.event_id = ?
       ORDER BY res.place ASC`,
      [eventId]
    );
    return rows;
  }

  static async getStats() {
    const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'upcoming' OR status = 'registration_open' THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM events
    `);
    return stats;
  }

  static async generateSlug(title) {
    let slug = title
      .toLowerCase()
      .replace(/[а-яёїіє]/g, c => ({ 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ю':'yu','я':'ya','ё':'yo' }[c] || c))
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    const [existing] = await pool.execute('SELECT slug FROM events WHERE slug LIKE ?', [`${slug}%`]);
    if (existing.length === 0) return slug;
    return `${slug}-${Date.now()}`;
  }
}

module.exports = Event;
