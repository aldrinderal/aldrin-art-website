const bcrypt = require('bcryptjs');
const { signAdminToken } = require('../middleware/auth');

/**
 * Verify given password against configured admin hash or password
 */
const verifyAdminPassword = async (inputPassword) => {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;

  // 1. If a bcrypt hash is provided in .env, compare using bcrypt
  if (hash && hash.trim() !== '') {
    return await bcrypt.compare(inputPassword, hash);
  }

  // 2. If a plain password is provided in .env (convenient for setup)
  if (plain && plain.trim() !== '') {
    return inputPassword === plain;
  }

  // 3. Fallback default if neither is set
  return inputPassword === 'aldrinart2026!';
};

/**
 * POST /api/admin/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password.'
      });
    }

    const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const inputUsername = username.trim().toLowerCase();

    if (inputUsername !== expectedUsername) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await verifyAdminPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const token = signAdminToken({ username: expectedUsername });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      admin: {
        username: expectedUsername,
        role: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/me (Protected)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin
  });
};

/**
 * POST /api/admin/logout
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  login,
  getMe,
  logout
};
