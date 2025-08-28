const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (patient or nakes)
 * @access  Public
 * @body    {
 *            email: string,
 *            password: string,
 *            confirmPassword: string,
 *            fullName: string,
 *            phone: string,
 *            role: 'patient' | 'nakes',
 *            address?: string,
 *            // Nakes specific fields
 *            nik?: string,
 *            str?: string,
 *            sip?: string,
 *            profession?: string,
 *            specialization?: string
 *          }
 */
router.post('/register', authLimiter, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    {
 *            email: string,
 *            password: string,
 *            rememberMe?: boolean
 *          }
 */
router.post('/login', authLimiter, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    {
 *            refreshToken: string
 *          }
 */
router.post('/refresh', generalLimiter, refreshToken);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 * @params  token: string
 */
router.get('/verify-email/:token', generalLimiter, verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    {
 *            email: string
 *          }
 */
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 * @params  token: string
 * @body    {
 *            password: string,
 *            confirmPassword: string
 *          }
 */
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    {
 *            currentPassword: string,
 *            newPassword: string,
 *            confirmPassword: string
 *          }
 */
router.put('/change-password', authenticateToken, changePassword);

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Private
 */
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'User is authenticated',
    data: {
      user: req.user
    }
  });
});

module.exports = router;