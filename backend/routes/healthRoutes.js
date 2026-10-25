const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isConfigured: isCloudinaryConfigured } = require('../config/cloudinary');

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return res.status(200).json({
    status: 'ok',
    service: 'Aldrin Art API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    cloudinary: {
      configured: isCloudinaryConfigured()
    }
  });
});

module.exports = router;
