const jwt = require('jsonwebtoken');

const getSecret = () => {
  return process.env.SESSION_SECRET || 'aldrin_art_default_development_secret_2026';
};

/**
 * Middleware to protect admin routes
 */
const requireAdminAuth = (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    } else if (req.query && req.query.auth_token) {
      // Optional for authorized direct viewing if needed
      token = req.query.auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const decoded = jwt.verify(token, getSecret());
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
};

/**
 * Sign a new JWT token for the administrator
 */
const signAdminToken = (adminPayload) => {
  return jwt.sign(
    {
      username: adminPayload.username,
      role: 'admin'
    },
    getSecret(),
    { expiresIn: '7d' } // 7 days token expiration
  );
};

module.exports = {
  requireAdminAuth,
  signAdminToken
};
