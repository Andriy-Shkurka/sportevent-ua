const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const hash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.role_id || 2, data.email, hash, data.first_name, data.last_name,
       data.phone || null, data.city || null, data.country || 'Україна']
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['first_name', 'last_name', 'phone', 'birth_date', 'city', 'country', 'bio', 'avatar'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return false;
    values.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  }

  static async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }

  static async getAll({ page = 1, limit = 20, search = '', role = '', is_blocked = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (role) {
      where += ' AND r.name = ?';
      params.push(role);
    }
    if (is_blocked !== '') {
      where += ' AND u.is_blocked = ?';
      params.push(parseInt(is_blocked));
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.city,
              u.is_active, u.is_blocked, u.created_at, u.last_login,
              r.name as role_name,
              COUNT(reg.id) as registrations_count
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN registrations reg ON reg.user_id = u.id
       ${where}
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.city,
                u.is_active, u.is_blocked, u.created_at, u.last_login, r.name
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(DISTINCT u.id) as total FROM users u JOIN roles r ON u.role_id = r.id ${where}`,
      params
    );

    return { users: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async updateRole(id, roleId) {
    await pool.execute('UPDATE users SET role_id = ? WHERE id = ?', [roleId, id]);
  }

  static async toggleBlock(id) {
    await pool.execute('UPDATE users SET is_blocked = NOT is_blocked WHERE id = ?', [id]);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async updateLastLogin(id) {
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async getStats() {
    const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_blocked = TRUE THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today
      FROM users
    `);
    return stats;
  }
}

module.exports = User;
