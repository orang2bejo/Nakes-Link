const express = require('express');
const { catchAsync } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const {
  createEmergency,
  getEmergency,
  getUserEmergencies,
  getActiveEmergencies,
  respondToEmergency,
  updateEmergencyStatus,
  getEmergencyStats
} = require('../controllers/emergencyController');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route   POST /api/emergency
 * @desc    Create new emergency request
 * @access  Private
 */
router.post('/', catchAsync(createEmergency));

/**
 * @route   GET /api/emergency
 * @desc    Get user's emergency history
 * @access  Private
 */
router.get('/', catchAsync(getUserEmergencies));

/**
 * @route   GET /api/emergency/active
 * @desc    Get active emergencies (for healthcare providers and admin)
 * @access  Private (Nakes/Admin)
 */
router.get('/active', catchAsync(getActiveEmergencies));

/**
 * @route   GET /api/emergency/stats
 * @desc    Get emergency statistics
 * @access  Private (Admin only)
 */
router.get('/stats', catchAsync(getEmergencyStats));

/**
 * @route   GET /api/emergency/:id
 * @desc    Get specific emergency details
 * @access  Private
 */
router.get('/:id', catchAsync(getEmergency));

/**
 * @route   PUT /api/emergency/:id/status
 * @desc    Update emergency status
 * @access  Private
 */
router.put('/:id/status', catchAsync(updateEmergencyStatus));

/**
 * @route   POST /api/emergency/:id/respond
 * @desc    Respond to emergency (for healthcare providers)
 * @access  Private (Nakes only)
 */
router.post('/:id/respond', catchAsync(respondToEmergency));

module.exports = router;