const { pool } = require('../config/database');

class Registration {
  static async findByUserAndEvent(userId, eventId) {
    const [rows] = await pool.execute(
      'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const regNumber = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [result] = await pool.execute(
      `INSERT INTO registrations (event_id, user_id, status, registration_number, team_name, notes)
       VALUES (?, ?, 'pending', ?, ?, ?)`,
      [data.event_id, data.user_id, regNumber, data.team_name || null, data.notes || null]
    );

    // Notify user
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Заявку подано', 'Вашу заявку прийнято на розгляд', 'info', ?)`,
      [data.user_id, `/cabinet/registrations`]
    );

    return result.insertId;
  }

  static async updateStatus(id, status, adminNotes = null) {
    await pool.execute(
      'UPDATE registrations SET status = ?, admin_notes = ? WHERE id = ?',
      [status, adminNotes, id]
    );

    // Notify user about status change
    const [rows] = await pool.execute('SELECT * FROM registrations WHERE id = ?', [id]);
    if (rows[0]) {
      const messages = {
        approved: { title: 'Заявку затверджено', msg: 'Вашу заявку на участь затверджено!', type: 'success' },
        rejected: { title: 'Заявку відхилено', msg: 'На жаль, вашу заявку відхилено.', type: 'error' },
        waitlist: { title: 'Лист очікування', msg: 'Вас додано до листа очікування.', type: 'warning' }
      };
      const notif = messages[status];
      if (notif) {
        await pool.execute(
          `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
          [rows[0].user_id, notif.title, notif.msg, notif.type, `/cabinet/registrations`]
        );
      }
    }
  }

  static async getByUser(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT r.*, e.title as event_title, e.slug as event_slug,
              e.start_date, e.end_date, e.status as event_status, e.cover_image,
              d.name as discipline_name, l.city as location_city
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN disciplines d ON e.discipline_id = d.id
       LEFT JOIN locations l ON e.location_id = l.id
       WHERE r.user_id = ?
       ORDER BY r.registered_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM registrations WHERE user_id = ?', [userId]
    );
    return { registrations: rows, total };
  }

  static async getAll({ page = 1, limit = 20, status = '', event_id = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND r.status = ?'; params.push(status); }
    if (event_id) { where += ' AND r.event_id = ?'; params.push(event_id); }

    const [rows] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name, u.email,
              e.title as event_title, e.start_date as event_start_date, d.name as discipline_name
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       JOIN disciplines d ON e.discipline_id = d.id
       ${where} ORDER BY r.registered_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM registrations r ${where}`, params
    );
    return { registrations: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async withdraw(id, userId) {
    await pool.execute(
      "UPDATE registrations SET status = 'withdrawn' WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  }
}

module.exports = Registration;
