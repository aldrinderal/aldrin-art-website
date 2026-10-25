const multer = require('multer');

// Store files in memory so we can upload buffer directly to Cloudinary without leaving disk artifacts
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed as reference photos.'
      ),
      false
    );
  }
};

const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || 5;

const upload = multer({
  storage,
  limits: {
    fileSize: maxMb * 1024 * 1024 // e.g. 5MB
  },
  fileFilter
});

module.exports = upload;
