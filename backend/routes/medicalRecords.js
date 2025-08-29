const express = require('express');
const { body, param, query } = require('express-validator');
const medicalRecordController = require('../controllers/medicalRecordController');
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

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit file uploads
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/medical-records/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and documents
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Validation rules
const createRecordValidation = [
  body('patient_id')
    .isUUID()
    .withMessage('Invalid patient ID format'),
  body('appointment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid appointment ID format'),
  body('diagnosis')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Diagnosis must be between 5 and 1000 characters'),
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Symptoms must not exceed 2000 characters'),
  body('treatment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Treatment must not exceed 2000 characters'),
  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medications.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),
  body('medications.*.dosage')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication dosage must be between 1 and 50 characters'),
  body('medications.*.frequency')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication frequency must be between 1 and 50 characters'),
  body('medications.*.duration')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication duration must be between 1 and 50 characters'),
  body('vital_signs')
    .optional()
    .isObject()
    .withMessage('Vital signs must be an object'),
  body('vital_signs.blood_pressure')
    .optional()
    .trim()
    .matches(/^\d{2,3}\/\d{2,3}$/)
    .withMessage('Blood pressure must be in format XXX/XXX'),
  body('vital_signs.heart_rate')
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage('Heart rate must be between 30 and 250 bpm'),
  body('vital_signs.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('Temperature must be between 30 and 45 degrees Celsius'),
  body('vital_signs.weight')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Weight must be between 1 and 500 kg'),
  body('vital_signs.height')
    .optional()
    .isFloat({ min: 30, max: 250 })
    .withMessage('Height must be between 30 and 250 cm'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Notes must not exceed 3000 characters'),
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid follow-up date'),
  body('is_confidential')
    .optional()
    .isBoolean()
    .withMessage('Is confidential must be a boolean value')
];

const updateRecordValidation = [
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Diagnosis must be between 5 and 1000 characters'),
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Symptoms must not exceed 2000 characters'),
  body('treatment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Treatment must not exceed 2000 characters'),
  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medications.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),
  body('medications.*.dosage')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication dosage must be between 1 and 50 characters'),
  body('medications.*.frequency')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication frequency must be between 1 and 50 characters'),
  body('medications.*.duration')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication duration must be between 1 and 50 characters'),
  body('vital_signs')
    .optional()
    .isObject()
    .withMessage('Vital signs must be an object'),
  body('vital_signs.blood_pressure')
    .optional()
    .trim()
    .matches(/^\d{2,3}\/\d{2,3}$/)
    .withMessage('Blood pressure must be in format XXX/XXX'),
  body('vital_signs.heart_rate')
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage('Heart rate must be between 30 and 250 bpm'),
  body('vital_signs.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('Temperature must be between 30 and 45 degrees Celsius'),
  body('vital_signs.weight')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Weight must be between 1 and 500 kg'),
  body('vital_signs.height')
    .optional()
    .isFloat({ min: 30, max: 250 })
    .withMessage('Height must be between 30 and 250 cm'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Notes must not exceed 3000 characters'),
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid follow-up date'),
  body('is_confidential')
    .optional()
    .isBoolean()
    .withMessage('Is confidential must be a boolean value')
];

const queryValidation = [
  query('patient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID format'),
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
  query('appointment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid appointment ID format'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search query must be at least 3 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const recordIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid medical record ID format')
];

// Medical record routes

/**
 * @route   POST /api/medical-records
 * @desc    Create a new medical record
 * @access  Private (Nakes only)
 */
router.post('/', authenticateToken, requireRole('nakes'), generalLimiter, createRecordValidation, medicalRecordController.createMedicalRecord);

/**
 * @route   GET /api/medical-records
 * @desc    Get medical records with filters
 * @access  Private
 */
router.get('/', authenticateToken, generalLimiter, queryValidation, medicalRecordController.getMedicalRecords);

/**
 * @route   GET /api/medical-records/:id
 * @desc    Get a single medical record
 * @access  Private
 */
router.get('/:id', authenticateToken, generalLimiter, recordIdValidation, medicalRecordController.getMedicalRecord);

/**
 * @route   PUT /api/medical-records/:id
 * @desc    Update a medical record
 * @access  Private (Nakes only)
 */
router.put('/:id', authenticateToken, requireRole('nakes'), generalLimiter, recordIdValidation, updateRecordValidation, medicalRecordController.updateMedicalRecord);

/**
 * @route   DELETE /api/medical-records/:id
 * @desc    Soft delete a medical record
 * @access  Private (Nakes only)
 */
router.delete('/:id', authenticateToken, requireRole('nakes'), generalLimiter, recordIdValidation, medicalRecordController.deleteMedicalRecord);

// File upload routes

/**
 * @route   POST /api/medical-records/:id/attachments
 * @desc    Upload attachments to a medical record
 * @access  Private (Nakes only)
 */
router.post('/:id/attachments', authenticateToken, requireRole('nakes'), uploadLimiter, recordIdValidation, upload.array('attachments', 5), medicalRecordController.uploadAttachments);

/**
 * @route   DELETE /api/medical-records/:id/attachments/:attachmentId
 * @desc    Remove an attachment from a medical record
 * @access  Private (Nakes only)
 */
router.delete('/:id/attachments/:attachmentId', authenticateToken, requireRole('nakes'), generalLimiter, [
  param('id')
    .isUUID()
    .withMessage('Invalid medical record ID format'),
  param('attachmentId')
    .isUUID()
    .withMessage('Invalid attachment ID format')
], medicalRecordController.removeAttachment);

/**
 * @route   GET /api/medical-records/:id/attachments/:attachmentId/download
 * @desc    Download an attachment
 * @access  Private
 */
router.get('/:id/attachments/:attachmentId/download', authenticateToken, generalLimiter, [
  param('id')
    .isUUID()
    .withMessage('Invalid medical record ID format'),
  param('attachmentId')
    .isUUID()
    .withMessage('Invalid attachment ID format')
], medicalRecordController.downloadAttachment);

// Patient-specific routes

/**
 * @route   GET /api/medical-records/patient/:patientId
 * @desc    Get medical records for a specific patient
 * @access  Private
 */
router.get('/patient/:patientId', authenticateToken, generalLimiter, [
  param('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format'),
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
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], medicalRecordController.getPatientMedicalRecords);

/**
 * @route   GET /api/medical-records/patient/:patientId/summary
 * @desc    Get medical records summary for a patient
 * @access  Private
 */
router.get('/patient/:patientId/summary', authenticateToken, generalLimiter, [
  param('patientId')
    .isUUID()
    .withMessage('Invalid patient ID format')
], medicalRecordController.getPatientMedicalSummary);

// Nakes-specific routes

/**
 * @route   GET /api/medical-records/nakes/my-records
 * @desc    Get medical records created by the current Nakes
 * @access  Private (Nakes only)
 */
router.get('/nakes/my-records', authenticateToken, requireRole('nakes'), generalLimiter, queryValidation, medicalRecordController.getNakesMedicalRecords);

/**
 * @route   GET /api/medical-records/nakes/patients
 * @desc    Get patients with medical records by current Nakes
 * @access  Private (Nakes only)
 */
router.get('/nakes/patients', authenticateToken, requireRole('nakes'), generalLimiter, [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], medicalRecordController.getNakesPatients);

// Statistics routes

/**
 * @route   GET /api/medical-records/stats
 * @desc    Get medical records statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, generalLimiter, [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('patient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID format'),
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format')
], medicalRecordController.getMedicalRecordStats);

// Search routes

/**
 * @route   GET /api/medical-records/search
 * @desc    Search medical records
 * @access  Private
 */
router.get('/search', authenticateToken, generalLimiter, [
  query('q')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search query must be at least 3 characters'),
  query('patient_id')
    .optional()
    .isUUID()
    .withMessage('Invalid patient ID format'),
  query('nakes_id')
    .optional()
    .isUUID()
    .withMessage('Invalid Nakes ID format'),
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
], medicalRecordController.searchMedicalRecords);

// Admin routes

/**
 * @route   GET /api/medical-records/admin/all
 * @desc    Get all medical records (admin)
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
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  query('is_confidential')
    .optional()
    .isBoolean()
    .withMessage('Is confidential must be a boolean value'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], medicalRecordController.getAllMedicalRecordsAdmin);

/**
 * @route   GET /api/medical-records/admin/stats
 * @desc    Get medical records statistics (admin)
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
    .withMessage('Please provide a valid end date')
], medicalRecordController.getMedicalRecordStatsAdmin);

/**
 * @route   PUT /api/medical-records/admin/:id/restore
 * @desc    Restore a deleted medical record (admin)
 * @access  Private (Admin only)
 */
router.put('/admin/:id/restore', authenticateToken, requireRole('admin'), generalLimiter, recordIdValidation, medicalRecordController.restoreMedicalRecordAdmin);

/**
 * @route   DELETE /api/medical-records/admin/:id/permanent
 * @desc    Permanently delete a medical record (admin)
 * @access  Private (Admin only)
 */
router.delete('/admin/:id/permanent', authenticateToken, requireRole('admin'), generalLimiter, recordIdValidation, medicalRecordController.permanentDeleteMedicalRecordAdmin);

module.exports = router;