const express = require('express');
const { authorize } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', 
  authorize(['admin']),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Admin users endpoint - Coming soon',
      data: { users: [] }
    });
  })
);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard',
  authorize(['admin']),
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      message: 'Admin dashboard endpoint - Coming soon',
      data: { stats: {} }
    });
  })
);

module.exports = router;