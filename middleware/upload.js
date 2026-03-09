const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/* Folder routing by field name */
const FOLDER_MAP = {
  cover_image: 'sportevent/covers',
  file:        'sportevent/gallery',
  avatar:      'sportevent/avatars'
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          FOLDER_MAP[file.fieldname] || 'sportevent/uploads',
    resource_type:   'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  })
});

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
