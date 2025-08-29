const express = require('express');
const { body, param, query } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

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

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit review creation
  message: {
    success: false,
    message: 'Too many review submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit image uploads
  message: {
    success: false,
    message: 'Too many image uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit moderation actions
  message: {
    success: false,
    message: 'Too many moderation actions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer configuration for review images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reviews/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only images
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
    files: 5 // Maximum 5 images
  },
  fileFilter: fileFilter
});

// Validation rules
const createReviewValidation = [
  body('appointment_id')
    .isUUID()
    .withMessage('Invalid appointment ID format'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comment must be between 10 and 2000 characters'),
  body('pros')
    .optional()
    .isArray()
    .withMessage('Pros must be an array'),
  body('pros.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each pro must be between 2 and 100 characters'),
  body('cons')
    .optional()
    .isArray()
    .withMessage('Cons must be an array'),
  body('cons.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each con must be between 2 and 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each tag must be between 2 and 50 characters'),
  body('is_anonymous')
    .optional()
    .isBoolean()
    .withMessage('Is anonymous must be a boolean value'),
  body('would_recommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean value')
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comment must be between 10 and 2000 characters'),
  body('pros')
    .optional()
    .isArray()
    .withMessage('Pros must be an array'),
  body('pros.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each pro must be between 2 and 100 characters'),
  body('cons')
    .optional()
    .isArray()
    .withMessage('Cons must be an array'),
  body('cons.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each con must be between 2 and 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each tag must be between 2 and 50 characters'),
  body('is_anonymous')
    .optional()
    .isBoolean()
    .withMessage('Is anonymous must be a boolean value'),
  body('would_recommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean value')
];

const reviewQueryValidation = [
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('patient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID format'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'hidden', 'flagged'])
    .withMessage('Invalid review status'),
  query('featured_only')
    .optional()
    .isBoolean()
    .withMessage('Featured only must be a boolean'),
  query('sort_by')
    .optional()
    .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
    .withMessage('Invalid sort option'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const helpfulValidation = [
  body('is_helpful')
    .isBoolean()
    .withMessage('Is helpful must be a boolean value')
];

const responseValidation = [
  body('response')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Response must be between 10 and 1000 characters')
];

const moderationValidation = [
  body('action')
    .isIn(['approve', 'reject', 'hide', 'flag', 'unflag', 'feature', 'unfeature'])
    .withMessage('Invalid moderation action'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must not exceed 1000 characters')
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search query must be at least 3 characters'),
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const reviewIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid review ID format')
];

// Public review routes

/**
 * @route   GET /api/reviews
 * @desc    Get reviews with filters
 * @access  Public
 */
router.get('/', generalLimiter, reviewQueryValidation, reviewController.getReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review
 * @access  Public
 */
router.get('/:id', generalLimiter, reviewIdValidation, reviewController.getReview);

/**
 * @route   GET /api/reviews/nakes/:nakesId
 * @desc    Get reviews for a specific Nakes
 * @access  Public
 */
router.get('/nakes/:nakesId', generalLimiter, [
  param('nakesId')
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('sort_by')
    .optional()
    .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getNakesReviews);

/**
 * @route   GET /api/reviews/service/:serviceId
 * @desc    Get reviews for a specific service
 * @access  Public
 */
router.get('/service/:serviceId', generalLimiter, [
  param('serviceId')
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('sort_by')
    .optional()
    .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getServiceReviews);

/**
 * @route   GET /api/reviews/featured
 * @desc    Get featured reviews
 * @access  Public
 */
router.get('/featured', generalLimiter, [
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], reviewController.getFeaturedReviews);

/**
 * @route   GET /api/reviews/stats
 * @desc    Get review statistics
 * @access  Public
 */
router.get('/stats', generalLimiter, [
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
], reviewController.getReviewStats);

/**
 * @route   GET /api/reviews/search
 * @desc    Search reviews
 * @access  Public
 */
router.get('/search', generalLimiter, searchValidation, reviewController.searchReviews);

// Patient review management routes

/**
 * @route   POST /api/reviews
 * @desc    Create a review
 * @access  Private (Patient only)
 */
router.post('/', authenticateToken, requireRole('patient'), reviewLimiter, upload.array('images', 5), createReviewValidation, reviewController.createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private (Patient only - own reviews)
 */
router.put('/:id', authenticateToken, requireRole('patient'), generalLimiter, reviewIdValidation, updateReviewValidation, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (Patient only - own reviews)
 */
router.delete('/:id', authenticateToken, requireRole('patient'), generalLimiter, reviewIdValidation, reviewController.deleteReview);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get current patient's reviews
 * @access  Private (Patient only)
 */
router.get('/my-reviews', authenticateToken, requireRole('patient'), generalLimiter, [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'hidden'])
    .withMessage('Invalid review status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getMyReviews);

// Review interaction routes

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Mark review as helpful/not helpful
 * @access  Private
 */
router.post('/:id/helpful', authenticateToken, generalLimiter, reviewIdValidation, helpfulValidation, reviewController.markReviewHelpful);

/**
 * @route   GET /api/reviews/:id/helpful-status
 * @desc    Get user's helpful status for a review
 * @access  Private
 */
router.get('/:id/helpful-status', authenticateToken, generalLimiter, reviewIdValidation, reviewController.getHelpfulStatus);

// Nakes response routes

/**
 * @route   POST /api/reviews/:id/response
 * @desc    Add Nakes response to review
 * @access  Private (Nakes only)
 */
router.post('/:id/response', authenticateToken, requireRole('nakes'), generalLimiter, reviewIdValidation, responseValidation, reviewController.addNakesResponse);

/**
 * @route   PUT /api/reviews/:id/response
 * @desc    Update Nakes response
 * @access  Private (Nakes only)
 */
router.put('/:id/response', authenticateToken, requireRole('nakes'), generalLimiter, reviewIdValidation, responseValidation, reviewController.updateNakesResponse);

/**
 * @route   DELETE /api/reviews/:id/response
 * @desc    Delete Nakes response
 * @access  Private (Nakes only)
 */
router.delete('/:id/response', authenticateToken, requireRole('nakes'), generalLimiter, reviewIdValidation, reviewController.deleteNakesResponse);

/**
 * @route   GET /api/reviews/nakes/my-reviews
 * @desc    Get reviews for current Nakes' services
 * @access  Private (Nakes only)
 */
router.get('/nakes/my-reviews', authenticateToken, requireRole('nakes'), generalLimiter, [
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'hidden', 'flagged'])
    .withMessage('Invalid review status'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('has_response')
    .optional()
    .isBoolean()
    .withMessage('Has response must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getNakesOwnReviews);

// Admin moderation routes

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/all', authenticateToken, requireRole('admin'), generalLimiter, [
  query('patient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID format'),
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'hidden', 'flagged'])
    .withMessage('Invalid review status'),
  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('flagged_only')
    .optional()
    .isBoolean()
    .withMessage('Flagged only must be a boolean'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], reviewController.getAllReviewsAdmin);

/**
 * @route   PUT /api/reviews/admin/:id/moderate
 * @desc    Moderate a review (admin)
 * @access  Private (Admin only)
 */
router.put('/admin/:id/moderate', authenticateToken, requireRole('admin'), moderationLimiter, reviewIdValidation, moderationValidation, reviewController.moderateReview);

/**
 * @route   GET /api/reviews/admin/stats
 * @desc    Get review statistics (admin)
 * @access  Private (Admin only)
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
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('service_id')
    .optional()
    .isUUID()
    .withMessage('Invalid service ID format')
], reviewController.getReviewStatsAdmin);

/**
 * @route   GET /api/reviews/admin/pending
 * @desc    Get pending reviews for moderation (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/pending', authenticateToken, requireRole('admin'), generalLimiter, [
  query('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid priority level'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getPendingReviewsAdmin);

/**
 * @route   GET /api/reviews/admin/flagged
 * @desc    Get flagged reviews (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/flagged', authenticateToken, requireRole('admin'), generalLimiter, [
  query('flag_reason')
    .optional()
    .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
    .withMessage('Invalid flag reason'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getFlaggedReviewsAdmin);

/**
 * @route   POST /api/reviews/admin/bulk-moderate
 * @desc    Bulk moderate reviews (admin)
 * @access  Private (Admin only)
 */
router.post('/admin/bulk-moderate', authenticateToken, requireRole('admin'), moderationLimiter, [
  body('review_ids')
    .isArray({ min: 1, max: 50 })
    .withMessage('Review IDs must be an array with 1-50 items'),
  body('review_ids.*')
    .isUUID()
    .withMessage('Each review ID must be a valid UUID'),
  body('action')
    .isIn(['approve', 'reject', 'hide', 'flag', 'unflag'])
    .withMessage('Invalid moderation action'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
], reviewController.bulkModerateReviews);

// Image management routes

/**
 * @route   POST /api/reviews/:id/images
 * @desc    Add images to review
 * @access  Private (Patient only - own reviews)
 */
router.post('/:id/images', authenticateToken, requireRole('patient'), uploadLimiter, reviewIdValidation, upload.array('images', 5), reviewController.addReviewImages);

/**
 * @route   DELETE /api/reviews/:id/images/:imageId
 * @desc    Remove image from review
 * @access  Private (Patient only - own reviews)
 */
router.delete('/:id/images/:imageId', authenticateToken, requireRole('patient'), generalLimiter, [
  param('id')
    .isUUID()
    .withMessage('Invalid review ID format'),
  param('imageId')
    .isUUID()
    .withMessage('Invalid image ID format')
], reviewController.removeReviewImage);

/**
 * @route   GET /api/reviews/images/:filename
 * @desc    Get review image
 * @access  Public
 */
router.get('/images/:filename', generalLimiter, [
  param('filename')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Filename is required')
], reviewController.getReviewImage);

// Report review routes

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report a review
 * @access  Private
 */
router.post('/:id/report', authenticateToken, generalLimiter, reviewIdValidation, [
  body('reason')
    .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
], reviewController.reportReview);

/**
 * @route   GET /api/reviews/admin/reports
 * @desc    Get review reports (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/reports', authenticateToken, requireRole('admin'), generalLimiter, [
  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'resolved', 'dismissed'])
    .withMessage('Invalid report status'),
  query('reason')
    .optional()
    .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
    .withMessage('Invalid report reason'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], reviewController.getReviewReportsAdmin);

module.exports = router;