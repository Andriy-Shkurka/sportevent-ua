const User = require('../models/User');
const Registration = require('../models/Registration');
const Result = require('../models/Result');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    const { password_hash, ...safeUser } = user;

    const [[{ events_count }]] = await pool.execute(
      "SELECT COUNT(*) as events_count FROM registrations WHERE user_id = ? AND status = 'approved'",
      [req.user.id]
    );
    const [[{ total_points }]] = await pool.execute(
      'SELECT COALESCE(SUM(points), 0) as total_points FROM results WHERE user_id = ?',
      [req.user.id]
    );

    const isTeam = safeUser.role_name === 'team';
    let team_members = [];
    let team_results = [];

    if (isTeam) {
      const [members] = await pool.execute(
        'SELECT id, first_name, last_name, birth_date, position FROM team_members WHERE team_user_id = ? ORDER BY id',
        [req.user.id]
      );
      team_members = members;

      // Team results — all results for the team account
      const [tResults] = await pool.execute(
        `SELECT r.*, e.title as event_title, e.start_date, d.name as discipline_name
         FROM results r
         JOIN events e ON e.id = r.event_id
         JOIN disciplines d ON d.id = e.discipline_id
         WHERE r.user_id = ?
         ORDER BY e.start_date DESC`,
        [req.user.id]
      );
      team_results = tResults;
    }

    res.json({ ...safeUser, events_count, total_points, team_members, team_results });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання профілю' });
  }
}

async function updateProfile(req, res) {
  try {
    const allowed = ['first_name', 'last_name', 'phone', 'birth_date', 'city', 'country', 'bio'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // PostgreSQL DATE column rejects empty strings → convert to null
        data[key] = req.body[key] === '' ? null : req.body[key];
      }
    }
    if (req.file) data.avatar = `/images/uploads/${req.file.filename}`;
    await User.update(req.user.id, data);
    res.json({ message: 'Профіль оновлено' });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: 'Помилка оновлення профілю', detail: err.message });
  }
}

async function getMyRegistrations(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await Registration.getByUser(req.user.id, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання заявок' });
  }
}

async function registerForEvent(req, res) {
  try {
    const { event_id, team_name, notes } = req.body;
    if (!event_id) return res.status(400).json({ error: 'Не вказано захід' });

    const existing = await Registration.findByUserAndEvent(req.user.id, event_id);
    if (existing) {
      return res.status(409).json({ error: 'Ви вже подали заявку на цей захід' });
    }

    const [events] = await pool.execute(
      "SELECT * FROM events WHERE id = ? AND status IN ('registration_open', 'upcoming')",
      [event_id]
    );
    if (!events.length) {
      return res.status(400).json({ error: 'Реєстрація на цей захід недоступна' });
    }

    const event = events[0];
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ error: 'Термін реєстрації минув' });
    }

    if (event.max_participants) {
      const [[{ count }]] = await pool.execute(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'approved'",
        [event_id]
      );
      if (count >= event.max_participants) {
        return res.status(400).json({ error: 'Досягнуто максимальну кількість учасників' });
      }
    }

    const id = await Registration.create({ event_id, user_id: req.user.id, team_name, notes });
    res.status(201).json({ message: 'Заявку подано успішно', id });
  } catch (err) {
    console.error('Register for event error:', err);
    res.status(500).json({ error: 'Помилка подачі заявки' });
  }
}

async function withdrawRegistration(req, res) {
  try {
    await Registration.withdraw(req.params.id, req.user.id);
    res.json({ message: 'Заявку скасовано' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка скасування заявки' });
  }
}

async function getMyResults(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await Result.getByUser(req.user.id, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання результатів' });
  }
}

async function getNotifications(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [[{ unread }]] = await pool.execute(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ notifications: rows, unread });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання сповіщень' });
  }
}

async function markNotificationRead(req, res) {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Позначено як прочитане' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Всі сповіщення позначено як прочитані' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення' });
  }
}

async function getTeamMembers(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, birth_date, position FROM team_members WHERE team_user_id = ? ORDER BY id',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання складу' });
  }
}

async function addTeamMember(req, res) {
  try {
    const { first_name, last_name, position, birth_date } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: "Ім'я та прізвище обов'язкові" });
    const [result] = await pool.execute(
      'INSERT INTO team_members (team_user_id, first_name, last_name, position, birth_date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, first_name.trim(), last_name.trim(), position || null, birth_date || null]
    );
    res.status(201).json({ id: result.insertId, first_name, last_name, position: position || null, birth_date: birth_date || null });
  } catch (err) {
    res.status(500).json({ error: 'Помилка додавання учасника' });
  }
}

async function updateTeamMember(req, res) {
  try {
    const { first_name, last_name, position, birth_date } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: "Ім'я та прізвище обов'язкові" });
    const [result] = await pool.execute(
      'UPDATE team_members SET first_name=?, last_name=?, position=?, birth_date=? WHERE id=? AND team_user_id=?',
      [first_name.trim(), last_name.trim(), position || null, birth_date || null, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Учасника не знайдено' });
    res.json({ message: 'Оновлено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка оновлення учасника' });
  }
}

async function deleteTeamMember(req, res) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM team_members WHERE id=? AND team_user_id=?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Учасника не знайдено' });
    res.json({ message: 'Видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення учасника' });
  }
}

async function deleteAccount(req, res) {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Введіть пароль для підтвердження' });
    const user = await User.findById(req.user.id);
    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Невірний пароль' });
    await User.delete(req.user.id);
    emailService.sendDeleteNotification(user.email, user.first_name || user.email).catch(() => {});
    res.json({ message: 'Акаунт успішно видалено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка видалення акаунту' });
  }
}

module.exports = {
  getProfile, updateProfile,
  getMyRegistrations, registerForEvent, withdrawRegistration,
  getMyResults, getNotifications, markNotificationRead, markAllNotificationsRead,
  getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember,
  deleteAccount
};
