const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/emergency
 * @desc    Get emergency services
 * @access  Private
 */
router.get('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Emergency services endpoint - Coming soon',
    data: { emergencyServices: [] }
  });
}));

/**
 * @route   POST /api/emergency
 * @desc    Create emergency request
 * @access  Private
 */
router.post('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Emergency request endpoint - Coming soon'
  });
}));

module.exports = router;