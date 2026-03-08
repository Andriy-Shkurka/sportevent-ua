const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GALLERY_DIR = path.join(__dirname, 'public', 'images', 'gallery');
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

// Реальні спортивні фото з Pexels CDN (безкоштовні, CC0)
// https://www.pexels.com/photo/{id}/
const photos = [
  // Легка атлетика / Біг (event_id=2)
  { event_id: 2, title: 'Старт забігу на 100м', alt: 'Спортсмени на старті спринту',
    file: 'athletics-sprint.jpg', url: 'https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 2, title: 'Марафонський забіг', alt: 'Бігуни на дистанції марафону',
    file: 'marathon-run.jpg', url: 'https://images.pexels.com/photos/2526881/pexels-photo-2526881.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 2, title: 'Фінішна пряма', alt: 'Спортсмен фінішує на треці',
    file: 'track-finish.jpg', url: 'https://images.pexels.com/photos/936094/pexels-photo-936094.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Плавання (event_id=3)
  { event_id: 3, title: 'Заплив вільним стилем', alt: 'Плавець у басейні',
    file: 'swimming-freestyle.jpg', url: 'https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 3, title: 'Старт зі стартової тумби', alt: 'Старт у плаванні',
    file: 'swimming-start.jpg', url: 'https://images.pexels.com/photos/221210/pexels-photo-221210.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 3, title: 'Кубок Дельфін — нагородження', alt: 'Нагородження переможців кубку',
    file: 'swimming-award.jpg', url: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Футбол (event_id=4)
  { event_id: 4, title: 'Футбольний матч', alt: "Гравці борються за м'яч",
    file: 'football-match.jpg', url: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 4, title: 'Удар по воротах', alt: 'Футбольний удар по воротах',
    file: 'football-shot.jpg', url: 'https://images.pexels.com/photos/262524/pexels-photo-262524.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 4, title: 'Командна гра', alt: 'Футболісти атакують',
    file: 'football-team.jpg', url: 'https://images.pexels.com/photos/2908175/pexels-photo-2908175.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Бокс (event_id=5)
  { event_id: 5, title: 'Боксерський поєдинок', alt: 'Боксери на рингу',
    file: 'boxing-fight.jpg', url: 'https://images.pexels.com/photos/3799832/pexels-photo-3799832.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 5, title: 'Тренування з боксу', alt: "Боксер б'є по груші",
    file: 'boxing-training.jpg', url: 'https://images.pexels.com/photos/4428277/pexels-photo-4428277.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 5, title: 'Зимовий кубок — фінал', alt: 'Фінальний бій кубку',
    file: 'boxing-final.jpg', url: 'https://images.pexels.com/photos/6203509/pexels-photo-6203509.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Баскетбол (event_id=6)
  { event_id: 6, title: 'Баскетбол 3x3', alt: 'Гра у вуличний баскетбол 3x3',
    file: 'basketball-3x3.jpg', url: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 6, title: 'Кидок у кошик', alt: "Гравець кидає м'яч у кільце",
    file: 'basketball-shot.jpg', url: 'https://images.pexels.com/photos/1080884/pexels-photo-1080884.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Велоспорт (event_id=7)
  { event_id: 7, title: 'Велозабіг Київська сотня', alt: 'Велосипедисти на трасі',
    file: 'cycling-race.jpg', url: 'https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 7, title: 'Пелетон на підйомі', alt: 'Група велосипедистів на підйомі',
    file: 'cycling-peloton.jpg', url: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Волейбол (event_id=8)
  { event_id: 8, title: 'Волейбольний блок', alt: 'Гравці виконують блок на сітці',
    file: 'volleyball-block.jpg', url: 'https://images.pexels.com/photos/3763869/pexels-photo-3763869.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 8, title: 'Подача у волейболі', alt: 'Спортсмен виконує подачу',
    file: 'volleyball-serve.jpg', url: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Теніс (event_id=9)
  { event_id: 9, title: 'Тенісний матч', alt: 'Гравець виконує удар',
    file: 'tennis-match.jpg', url: 'https://images.pexels.com/photos/1080883/pexels-photo-1080883.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: 9, title: 'Корт і трибуни', alt: 'Тенісний корт з глядачами',
    file: 'tennis-court.jpg', url: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Гімнастика (event_id=17)
  { event_id: 17, title: 'Гімнастичний виступ', alt: 'Гімнастка виконує елемент на помості',
    file: 'gymnastics.jpg', url: 'https://images.pexels.com/photos/3076514/pexels-photo-3076514.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Боротьба (event_id=18)
  { event_id: 18, title: 'Боротьба — сутичка', alt: 'Борці у поєдинку',
    file: 'wrestling.jpg', url: 'https://images.pexels.com/photos/4804083/pexels-photo-4804083.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Марафон Карпати (event_id=19)
  { event_id: 19, title: 'Карпатська сотня — старт', alt: 'Велика група бігунів на старті марафону',
    file: 'carpathian-marathon.jpg', url: 'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=800' },

  // Загальні
  { event_id: null, title: 'Нагородження переможців', alt: 'Вручення медалей переможцям змагань',
    file: 'awards-ceremony.jpg', url: 'https://images.pexels.com/photos/6203507/pexels-photo-6203507.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: null, title: 'Спортивна арена', alt: 'Стадіон під час змагань',
    file: 'sports-arena.jpg', url: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: null, title: 'Командний дух', alt: 'Спортсмени святкують перемогу',
    file: 'team-celebration.jpg', url: 'https://images.pexels.com/photos/248549/pexels-photo-248549.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { event_id: null, title: 'Розминка перед стартом', alt: 'Спортсмени готуються до змагань',
    file: 'warmup.jpg', url: 'https://images.pexels.com/photos/3764011/pexels-photo-3764011.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = url.startsWith('https') ? https : http;
    const req = get.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        return reject(new Error('HTTP ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', err => {
      file.close();
      try { fs.unlinkSync(dest); } catch(e) {}
      reject(err);
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'sports_events', charset: 'utf8mb4' });

  // Видаляємо всі старі фото галереї
  await pool.execute("DELETE FROM media WHERE file_path LIKE '%/gallery/%' OR file_path LIKE '%unsplash%' OR file_path LIKE '%picsum%'");
  // Видаляємо старі локальні файли
  if (fs.existsSync(GALLERY_DIR)) {
    fs.readdirSync(GALLERY_DIR).forEach(f => { try { fs.unlinkSync(path.join(GALLERY_DIR, f)); } catch(e) {} });
  }
  console.log('Cleared old gallery records & files\n');

  let ok = 0, fail = 0;
  for (const p of photos) {
    const dest = path.join(GALLERY_DIR, p.file);
    process.stdout.write(`[${photos.indexOf(p)+1}/${photos.length}] ${p.file} ... `);
    try {
      await download(p.url, dest);
      const size = fs.statSync(dest).size;
      if (size < 5000) throw new Error('File too small (' + size + ' bytes) — likely error page');
      await pool.execute(
        `INSERT INTO media (uploaded_by, event_id, file_name, file_path, file_type, mime_type, file_size, title, alt_text, is_public)
         VALUES (1, ?, ?, ?, 'image', 'image/jpeg', ?, ?, ?, 1)`,
        [p.event_id || null, p.file, '/images/gallery/' + p.file, size, p.title, p.alt]
      );
      console.log(`OK (${Math.round(size/1024)}KB)`);
      ok++;
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
      try { fs.unlinkSync(dest); } catch(ex) {}
      fail++;
    }
  }

  console.log(`\nDownloaded: ${ok} | Failed: ${fail}`);
  const [cnt] = await pool.execute("SELECT COUNT(*) as c FROM media WHERE file_type='image'");
  console.log('Total in DB:', cnt[0].c);
  await pool.end();
})();
