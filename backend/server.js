const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env in project root or current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // Fallback to current working directory

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const commissionRoutes = require('./routes/commissionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Security Headers with Helmet (configured to allow CDNs for Tailwind, Google Fonts, FontAwesome, Cloudinary)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled by default for easy CDN script & image loading
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS Configuration
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, or local file)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting to prevent abuse and DDoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api', generalLimiter);

// Specific rate limiter for commission submissions to prevent spam
const commissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 commission requests per hour per IP
  message: {
    success: false,
    message: 'Submission limit reached. Please wait a while before submitting another commission request.'
  }
});

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/commissions', commissionLimiter, commissionRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend files from project root
const publicDir = path.resolve(__dirname, '..');
app.use(express.static(publicDir));

// Fallback route for admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// Fallback 404 for unknown API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start HTTP Server only in traditional server environments (not in Vercel serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎨 Aldrin Art Server is running on port ${PORT}`);
    console.log(`🌐 Website URL: http://localhost:${PORT}`);
    console.log(`🔒 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
});

module.exports = app;
