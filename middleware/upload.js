const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/* -----------------------------------------------------------------------
   Cloudinary storage (production) — used only when env vars are set.
   Falls back to local disk if CLOUDINARY_CLOUD_NAME is missing.
   ----------------------------------------------------------------------- */
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (cloudinaryConfigured) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const cloudinary = require('../config/cloudinary');

  const FOLDER_MAP = {
    cover_image: 'sportevent/covers',
    file:        'sportevent/gallery',
    avatar:      'sportevent/avatars'
  };

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:          FOLDER_MAP[file.fieldname] || 'sportevent/uploads',
      resource_type:   'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    })
  });

  console.log('[upload] Using Cloudinary storage');
} else {
  // Local disk fallback (development or Render without env vars)
  const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname).toLowerCase());
    }
  });

  console.log('[upload] Cloudinary env vars missing — using local disk storage');
}

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Непідтримуваний формат файлу'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

module.exports = upload;
