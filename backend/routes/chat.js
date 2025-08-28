const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/chat
 * @desc    Get user chats
 * @access  Private
 */
router.get('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Chat endpoint - Coming soon',
    data: { chats: [] }
  });
}));

/**
 * @route   POST /api/chat
 * @desc    Send message
 * @access  Private
 */
router.post('/', catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Send message endpoint - Coming soon'
  });
}));

module.exports = router;