const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Необхідна авторизація' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = TRUE AND u.is_blocked = FALSE',
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Користувача не знайдено або заблоковано' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Термін дії токена вичерпано', expired: true });
    }
    return res.status(403).json({ error: 'Недійсний токен' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    pool.execute(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = TRUE',
      [decoded.userId]
    ).then(([rows]) => {
      if (rows.length) req.user = rows[0];
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

module.exports = { authenticateToken, optionalAuth };
