const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAdminAuth } = require('../middleware/auth');
const {
  createCommission,
  getCommissions,
  getCommissionById,
  updateCommissionStatus,
  deleteCommission
} = require('../controllers/commissionController');

// PUBLIC: Customer creates a new commission request (supports optional reference image)
router.post('/', upload.single('referenceImage'), createCommission);

// ADMIN PROTECTED ROUTES:
router.get('/', requireAdminAuth, getCommissions);
router.get('/:id', requireAdminAuth, getCommissionById);
router.patch('/:id/status', requireAdminAuth, updateCommissionStatus);
router.delete('/:id', requireAdminAuth, deleteCommission);

module.exports = router;
