const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pool } = require('../config/database');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function register(req, res) {
  try {
    const { email, password, first_name, last_name, phone, city, role_id, team_name, members } = req.body;

    const allowedRoles = [2, 3];
    const finalRoleId = allowedRoles.includes(parseInt(role_id)) ? parseInt(role_id) : 2;
    const isTeam = finalRoleId === 3;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
    }
    if (!isTeam && (!first_name || !last_name)) {
      return res.status(400).json({ error: 'Заповніть ім\'я та прізвище' });
    }
    if (isTeam && !team_name) {
      return res.status(400).json({ error: 'Вкажіть назву команди' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Пароль має містити мінімум 8 символів' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Користувач з таким email вже існує' });
    }

    // For team accounts use team_name as first_name
    const finalFirstName = isTeam ? team_name : first_name;
    const finalLastName  = isTeam ? '' : last_name;

    const userId = await User.create({ email, password, first_name: finalFirstName, last_name: finalLastName, phone, city, role_id: finalRoleId });
    const user = await User.findById(userId);
    const token = generateToken(userId);

    // Save team members
    if (isTeam && Array.isArray(members) && members.length) {
      for (const m of members) {
        if (m.first_name && m.last_name) {
          await pool.execute(
            'INSERT INTO team_members (team_user_id, first_name, last_name, birth_date, position) VALUES (?, ?, ?, ?, ?)',
            [userId, m.first_name.trim(), m.last_name.trim(), m.birth_date || null, m.position || null]
          );
        }
      }
    }

    // Welcome notification
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
      [userId, 'Ласкаво просимо!', `Вітаємо, ${finalFirstName}! Ваш акаунт успішно створено.`]
    );

    res.status(201).json({
      message: 'Реєстрацію успішно завершено',
      token,
      user: {
        id: user.id, email: user.email,
        first_name: user.first_name, last_name: user.last_name,
        role: user.role_name
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Помилка реєстрації' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введіть email та пароль' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Акаунт заблоковано. Зверніться до адміністратора.' });
    }

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    await User.updateLastLogin(user.id);
    const token = generateToken(user.id);

    let redirectTo = '/cabinet';
    if (user.role_name === 'admin') redirectTo = '/admin';

    res.json({
      message: 'Вхід успішний',
      token,
      redirectTo,
      user: {
        id: user.id, email: user.email,
        first_name: user.first_name, last_name: user.last_name,
        role: user.role_name, avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Помилка авторизації' });
  }
}

async function getMe(req, res) {
  try {
    const user = req.user;
    res.json({
      id: user.id, email: user.email,
      first_name: user.first_name, last_name: user.last_name,
      phone: user.phone, city: user.city, country: user.country,
      bio: user.bio, avatar: user.avatar, birth_date: user.birth_date,
      role: user.role_name, created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання даних' });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Заповніть усі поля' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Новий пароль має містити мінімум 8 символів' });
    }

    const user = await User.findById(req.user.id);
    const valid = await User.verifyPassword(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Поточний пароль невірний' });
    }

    await User.updatePassword(req.user.id, new_password);
    res.json({ message: 'Пароль успішно змінено' });
  } catch (err) {
    res.status(500).json({ error: 'Помилка зміни пароля' });
  }
}

module.exports = { register, login, getMe, changePassword };
