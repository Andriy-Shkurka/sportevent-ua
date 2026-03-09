require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Render/Heroku reverse proxy so express-rate-limit reads X-Forwarded-For correctly
app.set('trust proxy', 1);

// =============================================
// SECURITY MIDDLEWARE
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Забагато запитів. Спробуйте пізніше.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Забагато спроб входу. Спробуйте через 15 хвилин.' }
});

// =============================================
// BODY PARSING
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// STATIC FILES — before rate limiter so CSS/JS/images are not counted
// =============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Rate limiter applies only to page and API routes (not static files)
app.use(limiter);

// =============================================
// ROUTES
// =============================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/events');
const newsRoutes = require('./routes/news');
const publicRoutes = require('./routes/public');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', publicRoutes);

// =============================================
// PAGE ROUTES (SPA-like serving)
// =============================================
const viewsPath = path.join(__dirname, 'views');

app.get('/', (req, res) => res.sendFile(path.join(viewsPath, 'index.html')));
app.get('/events', (req, res) => res.sendFile(path.join(viewsPath, 'events.html')));
app.get('/events/:slug', (req, res) => res.sendFile(path.join(viewsPath, 'event-detail.html')));
app.get('/news', (req, res) => res.sendFile(path.join(viewsPath, 'news.html')));
app.get('/news/:slug', (req, res) => res.sendFile(path.join(viewsPath, 'news-detail.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(viewsPath, 'blog.html')));
app.get('/calendar', (req, res) => res.sendFile(path.join(viewsPath, 'calendar.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(viewsPath, 'gallery.html')));
app.get('/partners', (req, res) => res.sendFile(path.join(viewsPath, 'partners.html')));
app.get('/rules', (req, res) => res.sendFile(path.join(viewsPath, 'rules.html')));
app.get('/rankings', (req, res) => res.sendFile(path.join(viewsPath, 'rankings.html')));
app.get('/contacts', (req, res) => res.sendFile(path.join(viewsPath, 'contacts.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(viewsPath, 'faq.html')));

// Auth pages
app.get('/login', (req, res) => res.sendFile(path.join(viewsPath, 'auth', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(viewsPath, 'auth', 'register.html')));

// User cabinet
app.get('/cabinet', (req, res) => res.sendFile(path.join(viewsPath, 'user', 'dashboard.html')));
app.get('/cabinet/profile', (req, res) => res.sendFile(path.join(viewsPath, 'user', 'profile.html')));
app.get('/cabinet/registrations', (req, res) => res.sendFile(path.join(viewsPath, 'user', 'registrations.html')));
app.get('/cabinet/results', (req, res) => res.sendFile(path.join(viewsPath, 'user', 'results.html')));
app.get('/cabinet/notifications', (req, res) => res.sendFile(path.join(viewsPath, 'user', 'notifications.html')));

// Admin panel
app.get('/admin', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'dashboard.html')));
app.get('/admin/profile', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'profile.html')));
app.get('/admin/events', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'events.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'users.html')));
app.get('/admin/news', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'news.html')));
app.get('/admin/registrations', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'registrations.html')));
app.get('/admin/results', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'results.html')));
app.get('/admin/reports', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'reports.html')));
app.get('/admin/media', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'media.html')));
app.get('/admin/contacts', (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'contacts.html')));

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Маршрут не знайдено' });
  }
  res.status(404).sendFile(path.join(viewsPath, '404.html'));
});

// =============================================
// ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
  res.status(500).sendFile(path.join(viewsPath, '500.html'));
});

// =============================================
// START SERVER
// =============================================
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
  });
}

startServer();
