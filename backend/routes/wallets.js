const express = require('express');
const { body, param, query } = require('express-validator');
const walletController = require('../controllers/walletController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit wallet transactions
  message: {
    success: false,
    message: 'Too many wallet transactions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit PIN operations
  message: {
    success: false,
    message: 'Too many PIN attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation rules
const topUpValidation = [
  body('amount')
    .isFloat({ min: 10000, max: 10000000 }) // 10k - 10M IDR
    .withMessage('Top-up amount must be between 10,000 and 10,000,000 IDR'),
  body('payment_method')
    .isIn(['bank_transfer', 'credit_card', 'e_wallet', 'virtual_account'])
    .withMessage('Invalid payment method'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
];

const withdrawValidation = [
  body('amount')
    .isFloat({ min: 50000, max: 5000000 }) // 50k - 5M IDR
    .withMessage('Withdrawal amount must be between 50,000 and 5,000,000 IDR'),
  body('bank_account')
    .isObject()
    .withMessage('Bank account details are required'),
  body('bank_account.bank_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Bank name must be between 2 and 50 characters'),
  body('bank_account.account_number')
    .trim()
    .isLength({ min: 8, max: 20 })
    .isNumeric()
    .withMessage('Account number must be 8-20 digits'),
  body('bank_account.account_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters'),
  body('pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 6 digits'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
];

const transferValidation = [
  body('recipient_id')
    .isUUID()
    .withMessage('Invalid recipient ID format'),
  body('amount')
    .isFloat({ min: 1000, max: 5000000 }) // 1k - 5M IDR
    .withMessage('Transfer amount must be between 1,000 and 5,000,000 IDR'),
  body('pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 6 digits'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
];

const setPinValidation = [
  body('pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 6 digits'),
  body('confirm_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Confirm PIN must be 6 digits')
    .custom((value, { req }) => {
      if (value !== req.body.pin) {
        throw new Error('PIN confirmation does not match');
      }
      return true;
    })
];

const changePinValidation = [
  body('current_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Current PIN must be 6 digits'),
  body('new_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('New PIN must be 6 digits'),
  body('confirm_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Confirm PIN must be 6 digits')
    .custom((value, { req }) => {
      if (value !== req.body.new_pin) {
        throw new Error('PIN confirmation does not match');
      }
      return true;
    })
];

const transactionQueryValidation = [
  query('type')
    .optional()
    .isIn(['top_up', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'refund', 'commission', 'fee'])
    .withMessage('Invalid transaction type'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid transaction status'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Wallet routes

/**
 * @route   GET /api/wallets
 * @desc    Get user's wallet details
 * @access  Private
 */
router.get('/', authenticateToken, generalLimiter, walletController.getWallet);

/**
 * @route   GET /api/wallets/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', authenticateToken, generalLimiter, walletController.getWalletBalance);

/**
 * @route   GET /api/wallets/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', authenticateToken, generalLimiter, transactionQueryValidation, walletController.getTransactions);

/**
 * @route   GET /api/wallets/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/transactions/:id', authenticateToken, generalLimiter, [
  param('id')
    .isUUID()
    .withMessage('Invalid transaction ID format')
], walletController.getTransaction);

// Top-up routes

/**
 * @route   POST /api/wallets/top-up
 * @desc    Top up wallet
 * @access  Private
 */
router.post('/top-up', authenticateToken, transactionLimiter, topUpValidation, walletController.topUpWallet);

/**
 * @route   GET /api/wallets/top-up/methods
 * @desc    Get available top-up methods
 * @access  Private
 */
router.get('/top-up/methods', authenticateToken, generalLimiter, walletController.getTopUpMethods);

// Withdrawal routes

/**
 * @route   POST /api/wallets/withdraw
 * @desc    Withdraw from wallet
 * @access  Private
 */
router.post('/withdraw', authenticateToken, transactionLimiter, withdrawValidation, walletController.withdrawFromWallet);

/**
 * @route   GET /api/wallets/withdraw/banks
 * @desc    Get supported banks for withdrawal
 * @access  Private
 */
router.get('/withdraw/banks', authenticateToken, generalLimiter, walletController.getSupportedBanks);

/**
 * @route   GET /api/wallets/withdraw/limits
 * @desc    Get withdrawal limits
 * @access  Private
 */
router.get('/withdraw/limits', authenticateToken, generalLimiter, walletController.getWithdrawalLimits);

// Transfer routes

/**
 * @route   POST /api/wallets/transfer
 * @desc    Transfer to another wallet
 * @access  Private
 */
router.post('/transfer', authenticateToken, transactionLimiter, transferValidation, walletController.transferFunds);

/**
 * @route   GET /api/wallets/transfer/recipients
 * @desc    Get recent transfer recipients
 * @access  Private
 */
router.get('/transfer/recipients', authenticateToken, generalLimiter, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], walletController.getRecentRecipients);

/**
 * @route   GET /api/wallets/transfer/search-users
 * @desc    Search users for transfer
 * @access  Private
 */
router.get('/transfer/search-users', authenticateToken, generalLimiter, [
  query('query')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search query must be at least 3 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Limit must be between 1 and 10')
], walletController.searchUsersForTransfer);

// PIN management routes

/**
 * @route   POST /api/wallets/pin/set
 * @desc    Set wallet PIN
 * @access  Private
 */
router.post('/pin/set', authenticateToken, pinLimiter, setPinValidation, walletController.setWalletPin);

/**
 * @route   PUT /api/wallets/pin/change
 * @desc    Change wallet PIN
 * @access  Private
 */
router.put('/pin/change', authenticateToken, pinLimiter, changePinValidation, walletController.changeWalletPin);

/**
 * @route   POST /api/wallets/pin/verify
 * @desc    Verify wallet PIN
 * @access  Private
 */
router.post('/pin/verify', authenticateToken, pinLimiter, [
  body('pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('PIN must be 6 digits')
], walletController.verifyWalletPin);

/**
 * @route   POST /api/wallets/pin/reset
 * @desc    Reset wallet PIN (requires identity verification)
 * @access  Private
 */
router.post('/pin/reset', authenticateToken, pinLimiter, [
  body('verification_code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits'),
  body('new_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('New PIN must be 6 digits'),
  body('confirm_pin')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Confirm PIN must be 6 digits')
    .custom((value, { req }) => {
      if (value !== req.body.new_pin) {
        throw new Error('PIN confirmation does not match');
      }
      return true;
    })
], walletController.resetWalletPin);

// Statistics routes

/**
 * @route   GET /api/wallets/stats
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, generalLimiter, [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be day, week, month, or year'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
], walletController.getWalletStats);

/**
 * @route   GET /api/wallets/stats/summary
 * @desc    Get wallet summary statistics
 * @access  Private
 */
router.get('/stats/summary', authenticateToken, generalLimiter, walletController.getWalletSummary);

// Admin routes

/**
 * @route   GET /api/wallets/admin/all
 * @desc    Get all wallets (admin)
 * @access  Private (Admin)
 */
router.get('/admin/all', authenticateToken, requireRole('admin'), generalLimiter, [
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID format'),
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'frozen'])
    .withMessage('Invalid wallet status'),
  query('min_balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum balance must be a positive number'),
  query('max_balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum balance must be a positive number'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], walletController.getAllWalletsAdmin);

/**
 * @route   GET /api/wallets/admin/:userId
 * @desc    Get user wallet (admin)
 * @access  Private (Admin)
 */
router.get('/admin/:userId', authenticateToken, requireRole('admin'), generalLimiter, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
], walletController.getUserWalletAdmin);

/**
 * @route   PUT /api/wallets/admin/:userId/status
 * @desc    Update wallet status (admin)
 * @access  Private (Admin)
 */
router.put('/admin/:userId/status', authenticateToken, requireRole('admin'), generalLimiter, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('status')
    .isIn(['active', 'suspended', 'frozen'])
    .withMessage('Invalid wallet status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
], walletController.updateWalletStatusAdmin);

/**
 * @route   POST /api/wallets/admin/:userId/adjust
 * @desc    Adjust wallet balance (admin)
 * @access  Private (Admin)
 */
router.post('/admin/:userId/adjust', authenticateToken, requireRole('admin'), generalLimiter, [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('amount')
    .isFloat()
    .withMessage('Amount must be a number'),
  body('type')
    .isIn(['credit', 'debit'])
    .withMessage('Type must be credit or debit'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must not exceed 1000 characters')
], walletController.adjustWalletBalanceAdmin);

/**
 * @route   GET /api/wallets/admin/stats
 * @desc    Get wallet statistics (admin)
 * @access  Private (Admin)
 */
router.get('/admin/stats', authenticateToken, requireRole('admin'), generalLimiter, [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('user_type')
    .optional()
    .isIn(['patient', 'nakes'])
    .withMessage('User type must be patient or nakes')
], walletController.getWalletStatsAdmin);

module.exports = router;