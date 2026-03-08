/* =============================================
   SPORTS EVENTS MANAGEMENT - Shared Utilities
   ============================================= */

// ── XSS escape helper ─────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Auth ──────────────────────────────────────
const Auth = {
  getToken() { return localStorage.getItem('token'); },
  getUser()  { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } },
  setSession(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  clearSession() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; },
  logout() { this.clearSession(); window.location.href = '/'; },
  async refreshUser() {
    try {
      const data = await API.get('/auth/me', true);
      if (data && data.id) {
        const merged = { ...(this.getUser() || {}), ...data };
        localStorage.setItem('user', JSON.stringify(merged));
        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.textContent = (data.first_name || '') + ' ' + (data.last_name || '');
        const avEl = document.getElementById('adminAvatarPh');
        if (avEl) avEl.textContent = ((data.first_name || '')[0] + (data.last_name || '')[0]).toUpperCase();
      }
    } catch (e) {}
  }
};

// ── API ───────────────────────────────────────
const API = {
  BASE: '/api',
  async request(method, path, body, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth || Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Помилка запиту'), { status: res.status, data });
    return data;
  },
  get(path, auth)        { return this.request('GET', path, null, auth); },
  post(path, body, auth) { return this.request('POST', path, body, auth); },
  put(path, body, auth)  { return this.request('PUT', path, body, auth); },
  patch(path, body, auth){ return this.request('PATCH', path, body, auth); },
  delete(path, auth)     { return this.request('DELETE', path, null, auth); },
  async upload(path, formData) {
    const headers = {};
    if (Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
    const res = await fetch(this.BASE + path, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Помилка завантаження'), { status: res.status });
    return data;
  }
};

// ── Toast ─────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '1.1rem';
  iconSpan.textContent = icons[type] || 'ℹ';

  const msgSpan = document.createElement('span');
  msgSpan.style.flex = '1';
  msgSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:0 0.25rem';
  closeBtn.addEventListener('click', () => toast.remove());

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, duration);
}

// ── Date/Format utils ─────────────────────────
function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const defaults = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('uk-UA', { ...defaults, ...opts });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'щойно';
  if (m < 60) return `${m} хв. тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год. тому`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. тому`;
  return formatDate(dateStr);
}

function formatMoney(n) {
  if (!n || n == 0) return 'Безкоштовно';
  return Number(n).toLocaleString('uk-UA') + ' грн';
}

// ── Status Labels ─────────────────────────────
const STATUS_LABELS = {
  draft: 'Чернетка', upcoming: 'Майбутній', registration_open: 'Реєстрація відкрита',
  registration_closed: 'Реєстрація закрита', ongoing: 'Відбувається', completed: 'Завершено', cancelled: 'Скасовано'
};

const REG_STATUS_LABELS = {
  pending: 'На розгляді', approved: 'Підтверджено', rejected: 'Відхилено', withdrawn: 'Відкликано'
};

const NEWS_CATEGORIES = {
  news: 'Новини', announcement: 'Анонс', blog: 'Блог', analytics: 'Аналітика',
  result: 'Результати', interview: 'Інтерв\'ю', general: 'Загальне', press: 'Прес-реліз'
};

function statusBadge(status, labels = STATUS_LABELS) {
  const label = labels[status] || status;
  return `<span class="badge status-${status}">${label}</span>`;
}

function regStatusBadge(status) {
  return statusBadge(status, REG_STATUS_LABELS);
}

// ── Navbar ────────────────────────────────────
function initNavbar() {
  const user = Auth.getUser();
  const nav  = document.getElementById('navActions');
  if (!nav) return;

  if (user) {
    const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase();
    nav.innerHTML = `
      <a href="${user.role === 'admin' ? '/admin' : '/cabinet'}" class="btn btn-outline btn-sm" style="gap:.5rem">
        <span style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff">${initials}</span>
        <span class="nav-user-name">${user.first_name}</span>
      </a>
      <button class="btn btn-ghost btn-sm" onclick="Auth.logout()">Вийти</button>
    `;
  } else {
    nav.innerHTML = `
      <a href="/login" class="btn btn-ghost btn-sm">Вхід</a>
      <a href="/register" class="btn btn-primary btn-sm">Реєстрація</a>
    `;
  }

  // Hamburger
  const hbBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hbBtn && mobileMenu) {
    hbBtn.addEventListener('click', () => {
      hbBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }
}

// ── Active nav link ───────────────────────────
function setActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    const isActive = href === path || (href !== '/' && path.startsWith(href));
    a.classList.toggle('active', isActive);
  });
}

// ── Pagination renderer ───────────────────────
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const c = document.getElementById(containerId);
  if (!c || totalPages <= 1) { if (c) c.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${currentPage===1?'disabled':''} onclick="(${onPageChange})(${currentPage-1})">‹</button>`;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) pages.push(i);
    else if (pages[pages.length-1] !== '…') pages.push('…');
  }
  pages.forEach(p => {
    if (p === '…') html += `<span class="page-btn" style="cursor:default">…</span>`;
    else html += `<button class="page-btn ${p===currentPage?'active':''}" onclick="(${onPageChange})(${p})">${p}</button>`;
  });
  html += `<button class="page-btn" ${currentPage===totalPages?'disabled':''} onclick="(${onPageChange})(${currentPage+1})">›</button>`;
  c.innerHTML = html;
}

// ── Loader ────────────────────────────────────
function showLoader(containerId) {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
}

function showEmpty(containerId, msg = 'Нічого не знайдено', icon = '🔍') {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${msg}</h3></div>`;
}

// ── Auth guard ────────────────────────────────
function requireAuth(redirectTo = '/login') {
  if (!Auth.isLoggedIn()) { window.location.href = redirectTo; return false; }
  return true;
}

function requireAdminAuth() {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) { window.location.href = '/login'; return false; }
  Auth.refreshUser();
  return true;
}

// ── Event image placeholder ───────────────────
function eventImageHtml(img, alt = '') {
  return img
    ? `<img src="/uploads/${img}" alt="${alt}" loading="lazy">`
    : `<div class="no-image">🏆</div>`;
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setActiveNavLink();
});
