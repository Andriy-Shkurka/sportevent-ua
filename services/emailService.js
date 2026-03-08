const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

const FROM = () => `"СпортUA" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sportevent.ua'}>`;
const APP_URL = () => process.env.APP_URL || 'http://localhost:3000';

function wrap(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0D1117;font-family:Inter,Arial,sans-serif;color:#E6EDF3}
  .wrap{max-width:520px;margin:40px auto;background:#161B22;border-radius:12px;overflow:hidden;border:1px solid #30363D}
  .header{background:#E63946;padding:24px 32px}
  .header h1{margin:0;font-size:1.3rem;color:#fff}
  .body{padding:28px 32px}
  .body p{color:#8B949E;line-height:1.6;margin:.5rem 0}
  .body strong{color:#E6EDF3}
  .btn{display:inline-block;margin-top:1.25rem;padding:.75rem 1.5rem;background:#E63946;color:#fff;border-radius:8px;text-decoration:none;font-weight:700}
  .footer{padding:16px 32px;border-top:1px solid #30363D;font-size:.8rem;color:#484F58;text-align:center}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>⚡ СпортUA — ${title}</h1></div>
  <div class="body">${body}</div>
  <div class="footer">© ${new Date().getFullYear()} СпортUA. Це автоматичне повідомлення.</div>
</div></body></html>`;
}

async function send(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    return;
  }
  await t.sendMail({ from: FROM(), to, subject, html });
}

// ─── Public helpers ────────────────────────────────────────────────────────

async function sendBanNotification(email, firstName, reason) {
  const subject = 'Ваш акаунт заблоковано | СпортUA';
  const html = wrap('Акаунт заблоковано', `
    <p>Привіт, <strong>${firstName}</strong>!</p>
    <p>Ваш акаунт на платформі <strong>СпортUA</strong> було <strong style="color:#E63946">заблоковано</strong> адміністратором.</p>
    ${reason ? `<p>Причина: <strong>${reason}</strong></p>` : ''}
    <p>Якщо ви вважаєте, що це сталося помилково, зверніться до підтримки.</p>
    <a href="${APP_URL()}/contacts" class="btn">Зв'язатися з підтримкою</a>
  `);
  await send(email, subject, html);
}

async function sendUnbanNotification(email, firstName) {
  const subject = 'Ваш акаунт розблоковано | СпортUA';
  const html = wrap('Акаунт розблоковано', `
    <p>Привіт, <strong>${firstName}</strong>!</p>
    <p>Ваш акаунт на платформі <strong>СпортUA</strong> було <strong style="color:#2ea043">розблоковано</strong>.</p>
    <p>Ви знову можете користуватися всіма функціями платформи.</p>
    <a href="${APP_URL()}/login" class="btn">Увійти в акаунт</a>
  `);
  await send(email, subject, html);
}

async function sendDeleteNotification(email, firstName) {
  const subject = 'Ваш акаунт видалено | СпортUA';
  const html = wrap('Акаунт видалено', `
    <p>Привіт, <strong>${firstName}</strong>!</p>
    <p>Ваш акаунт на платформі <strong>СпортUA</strong> було <strong>видалено</strong> відповідно до вашого запиту.</p>
    <p>Усі ваші дані було безповоротно видалено.</p>
    <p>Ви завжди можете зареєструватися знову.</p>
    <a href="${APP_URL()}/register" class="btn">Зареєструватися</a>
  `);
  await send(email, subject, html);
}

module.exports = { sendBanNotification, sendUnbanNotification, sendDeleteNotification };
