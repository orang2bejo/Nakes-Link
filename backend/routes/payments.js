const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/payments
 * @desc    Get user payments
 * @access  Private
 */
router.get('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Payments endpoint - Coming soon',
    data: { payments: [] }
  });
}));

/**
 * @route   POST /api/payments
 * @desc    Create new payment
 * @access  Private
 */
router.post('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Create payment endpoint - Coming soon'
  });
}));

module.exports = router;