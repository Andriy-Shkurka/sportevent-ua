function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Необхідна авторизація' });
    }
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Недостатньо прав доступу' });
    }
    next();
  };
}

const requireAdmin = requireRole('admin');
const requireAthlete = requireRole('admin', 'athlete', 'team');

module.exports = { requireRole, requireAdmin, requireAthlete };
