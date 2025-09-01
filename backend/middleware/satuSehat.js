/**
 * SatuSehat Middleware
 * Middleware functions for SatuSehat API integration
 */

const satuSehatConfig = require('../config/satuSehat');
const { AppError } = require('./errorHandler');

/**
 * Validate NIK format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateNIK = (req, res, next) => {
  const { nik } = req.body;
  
  if (!nik) {
    return next(new AppError('NIK is required', 400));
  }
  
  if (!satuSehatConfig.validation.nik.pattern.test(nik)) {
    return next(new AppError('Invalid NIK format. NIK must be 16 digits', 400));
  }
  
  next();
};

/**
 * Validate STR format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSTR = (req, res, next) => {
  const { str } = req.body;
  
  if (!str) {
    return next(new AppError('STR is required', 400));
  }
  
  const { minLength, maxLength, pattern } = satuSehatConfig.validation.str;
  
  if (str.length < minLength || str.length > maxLength) {
    return next(new AppError(`STR must be between ${minLength} and ${maxLength} characters`, 400));
  }
  
  if (!pattern.test(str)) {
    return next(new AppError('Invalid STR format. STR must contain only uppercase letters and numbers', 400));
  }
  
  next();
};

/**
 * Check if user is eligible for SatuSehat verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkSatuSehatEligibility = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    if (user.role !== 'nakes') {
      return next(new AppError('Only healthcare professionals (Nakes) can use SatuSehat verification', 403));
    }
    
    // Check if user has required profile information
    if (!user.fullName || !user.phone) {
      return next(new AppError('Please complete your profile before SatuSehat verification', 400));
    }
    
    req.user = user; // Attach full user object to request
    next();
  } catch (error) {
    next(new AppError('Error checking user eligibility', 500));
  }
};

/**
 * Rate limiting for SatuSehat API calls
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimitSatuSehat = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute per user
  
  if (!global.satuSehatRateLimit) {
    global.satuSehatRateLimit = new Map();
  }
  
  const userRequests = global.satuSehatRateLimit.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return next(new AppError('Too many SatuSehat requests. Please try again later.', 429));
  }
  
  recentRequests.push(now);
  global.satuSehatRateLimit.set(userId, recentRequests);
  
  next();
};

/**
 * Log SatuSehat API calls for audit purposes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logSatuSehatCall = (req, res, next) => {
  const { method, originalUrl, user } = req;
  const timestamp = new Date().toISOString();
  
  console.log(`[SatuSehat API] ${timestamp} - User: ${user.id} - ${method} ${originalUrl}`);
  
  // In production, use proper logging service
  // logger.info('SatuSehat API call', {
  //   userId: user.id,
  //   method,
  //   url: originalUrl,
  //   timestamp,
  //   userAgent: req.get('User-Agent'),
  //   ip: req.ip
  // });
  
  next();
};

/**
 * Validate SatuSehat configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSatuSehatConfig = (req, res, next) => {
  if (!satuSehatConfig.clientId || !satuSehatConfig.clientSecret) {
    return next(new AppError('SatuSehat configuration is incomplete. Please contact administrator.', 500));
  }
  
  next();
};

module.exports = {
  validateNIK,
  validateSTR,
  checkSatuSehatEligibility,
  rateLimitSatuSehat,
  logSatuSehatCall,
  validateSatuSehatConfig
};