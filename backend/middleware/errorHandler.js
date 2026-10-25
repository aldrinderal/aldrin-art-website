const errorHandler = (err, req, res, next) => {
  // Log error details for server diagnostics
  console.error('⚠️ Handled Application Error:', err.message);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxMb = process.env.MAX_FILE_SIZE_MB || 5;
    return res.status(400).json({
      success: false,
      message: `The uploaded image is too large. Maximum allowed file size is ${maxMb}MB.`
    });
  }

  // Multer custom fileFilter error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: messages
    });
  }

  // Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Commission record not found (invalid identifier).'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with duplicate unique fields already exists.'
    });
  }

  // Default server error
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;
