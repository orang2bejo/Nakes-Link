const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/appointments
 * @desc    Get user appointments
 * @access  Private
 */
router.get('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Appointments endpoint - Coming soon',
    data: { appointments: [] }
  });
}));

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Create appointment endpoint - Coming soon'
  });
}));

module.exports = router;