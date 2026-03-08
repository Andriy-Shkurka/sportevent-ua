const { pool } = require('../config/database');

class Result {
  static async getAll({ page = 1, limit = 20, search = '', event_id = '', place = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR e.title LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (event_id) {
      where += ' AND res.event_id = ?';
      params.push(parseInt(event_id));
    }
    if (place) {
      where += ' AND res.place = ?';
      params.push(parseInt(place));
    }

    const [rows] = await pool.execute(
      `SELECT res.id, res.place, res.result_value, res.result_unit, res.points,
              res.notes, res.event_id, res.user_id, res.created_at,
              u.first_name, u.last_name, u.email,
              e.title as event_title, d.name as discipline_name
       FROM results res
       JOIN users u ON res.user_id = u.id
       JOIN events e ON res.event_id = e.id
       JOIN disciplines d ON e.discipline_id = d.id
       ${where} ORDER BY res.place ASC, e.start_date DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM results res
       JOIN users u ON res.user_id = u.id
       JOIN events e ON res.event_id = e.id
       ${where}`,
      params
    );

    return { results: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createOrUpdate(data) {
    const [existing] = await pool.execute(
      'SELECT id FROM results WHERE event_id = ? AND user_id = ?',
      [data.event_id, data.user_id]
    );

    if (existing.length) {
      await pool.execute(
        `UPDATE results SET place = ?, result_value = ?, result_unit = ?,
         points = ?, notes = ?
         WHERE event_id = ? AND user_id = ?`,
        [data.place || null, data.result_value || null, data.result_unit || null,
         data.points || 0, data.notes || null, data.event_id, data.user_id]
      );
      return existing[0].id;
    }

    const [result] = await pool.execute(
      `INSERT INTO results (event_id, user_id, registration_id, place, result_value,
       result_unit, points, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.event_id, data.user_id, data.registration_id || null,
       data.place || null, data.result_value || null, data.result_unit || null,
       data.points || 0, data.notes || null]
    );

    await Result.updateRankings(data.user_id, data.discipline_id, data.points || 0, data.place);

    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'info', ?)`,
      [data.user_id, 'Результати опубліковано', 'Ваші результати змагань опубліковано', '/cabinet/results']
    );

    return result.insertId;
  }

  static async update(id, data) {
    const allowed = ['place', 'result_value', 'result_unit', 'points', 'notes', 'disqualified', 'disqualification_reason'];
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
    await pool.execute(`UPDATE results SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.execute('DELETE FROM results WHERE id = ?', [id]);
  }

  static async getByUser(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      `SELECT res.*, e.title as event_title, e.slug as event_slug,
              e.start_date, d.name as discipline_name
       FROM results res
       JOIN events e ON res.event_id = e.id
       JOIN disciplines d ON e.discipline_id = d.id
       WHERE res.user_id = ? ORDER BY e.start_date DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM results WHERE user_id = ?', [userId]
    );
    return { results: rows, total };
  }

  static async updateRankings(userId, disciplineId, points, place) {
    if (!disciplineId) return;
    const year = new Date().getFullYear();
    const medals = {
      gold: place === 1 ? 1 : 0,
      silver: place === 2 ? 1 : 0,
      bronze: place === 3 ? 1 : 0
    };
    await pool.upsertRanking(userId, disciplineId, year, points,
      medals.gold, medals.silver, medals.bronze);
    // Recompute rank_position for all entries in this discipline+year
    await pool.updateRankPositions(disciplineId, year);
  }
}

module.exports = Result;
