const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Check if Cloudinary credentials are fully configured
 */
const isConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload an image buffer (from Multer memory storage) to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} customOptions - Extra upload options
 * @returns {Promise<{ url: string, secure_url: string, public_id: string }>}
 */
const uploadImageStream = (buffer, customOptions = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
        )
      );
    }

    const options = {
      folder: 'aldrin_art_commissions',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...customOptions
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Safely delete an image asset from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicId) => {
  if (!publicId || !isConfigured()) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset (${publicId}):`, error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImageStream,
  deleteImage
};
