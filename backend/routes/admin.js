const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAdminAction, rateLimitAdmin } = require('../middleware/security');
const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Apply admin authentication and rate limiting to all routes
router.use(authenticate);
router.use(authorize(['admin']));
router.use(rateLimitAdmin);

// Dashboard Statistics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/charts', adminController.getChartData);
router.get('/dashboard/recent-activities', adminController.getRecentActivities);

// User Management
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['patient', 'nakes', 'admin']),
  query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
  query('verified').optional().isBoolean(),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'name', 'email', 'lastLogin']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], adminController.getUsers);

router.get('/users/:userId', [
  param('userId').isMongoId(),
  handleValidationErrors
], adminController.getUserDetails);

router.put('/users/:userId/verify', [
  param('userId').isMongoId(),
  body('verified').isBoolean(),
  body('reason').optional().isLength({ min: 1, max: 500 }),
  handleValidationErrors,
  validateAdminAction
], adminController.verifyUser);

router.put('/users/:userId/suspend', [
  param('userId').isMongoId(),
  body('suspended').isBoolean(),
  body('reason').isLength({ min: 1, max: 500 }),
  body('duration').optional().isInt({ min: 1 }), // Duration in days
  handleValidationErrors,
  validateAdminAction
], adminController.suspendUser);

// Nakes Verification
router.get('/nakes/pending-verification', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'name', 'specialization']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], adminController.getPendingNakesVerification);

router.put('/nakes/:nakesId/verify', [
  param('nakesId').isMongoId(),
  body('verified').isBoolean(),
  body('reason').optional().isLength({ min: 1, max: 500 }),
  body('notes').optional().isLength({ max: 1000 }),
  handleValidationErrors,
  validateAdminAction
], adminController.verifyNakes);

// Payment Management
router.get('/payments', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
  query('method').optional().isIn(['midtrans', 'xendit', 'wallet']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  handleValidationErrors
], adminController.getPayments);

// Service Management
router.get('/services', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isLength({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  handleValidationErrors
], adminController.getServices);

router.put('/services/:serviceId/status', [
  param('serviceId').isMongoId(),
  body('isActive').isBoolean(),
  body('reason').optional().isLength({ min: 1, max: 500 }),
  handleValidationErrors,
  validateAdminAction
], adminController.updateServiceStatus);

// Reports
router.get('/reports/revenue', [
  query('period').isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  handleValidationErrors
], adminController.getRevenueReport);

router.get('/reports/users', [
  query('period').isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('role').optional().isIn(['patient', 'nakes']),
  handleValidationErrors
], adminController.getUserReport);

module.exports = router;