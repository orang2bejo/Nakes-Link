const { ValidationError, DatabaseError, ConnectionError } = require('sequelize');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationAppError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.name = 'ValidationAppError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handling functions
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));
  
  return new ValidationAppError('Validation failed', errors);
};

const handleSequelizeDatabaseError = (err) => {
  let message = 'Database operation failed';
  let statusCode = 500;
  
  // Handle specific database errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    message = `${field} already exists`;
    statusCode = 409;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Referenced resource does not exist';
    statusCode = 400;
  } else if (err.name === 'SequelizeConnectionError') {
    message = 'Database connection failed';
    statusCode = 503;
  }
  
  return new AppError(message, statusCode);
};

const handleJWTError = () => {
  return new AuthenticationError('Invalid token');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Token expired');
};

const handleMulterError = (err) => {
  let message = 'File upload failed';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large';
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
  }
  
  return new ValidationAppError(message);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      status: err.status,
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.field && { field: err.field })
    }
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.field && { field: err.field })
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  
  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error 💥:', err);
  } else {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  // Handle specific error types
  if (err instanceof ValidationError) {
    error = handleSequelizeValidationError(err);
  } else if (err instanceof DatabaseError || err instanceof ConnectionError) {
    error = handleSequelizeDatabaseError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  } else if (err.code === 'ENOENT') {
    error = new NotFoundError('File not found');
  } else if (err.code === 'EACCES') {
    error = new AppError('Permission denied', 403);
  } else if (err.type === 'entity.parse.failed') {
    error = new ValidationAppError('Invalid JSON format');
  } else if (err.type === 'entity.too.large') {
    error = new ValidationAppError('Request entity too large');
  }
  
  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const err = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(err);
};

module.exports = {
  errorHandler,
  catchAsync,
  notFound,
  
  // Error classes
  AppError,
  ValidationAppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};