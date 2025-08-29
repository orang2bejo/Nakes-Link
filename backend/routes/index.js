const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const serviceRoutes = require('./services');
const appointmentRoutes = require('./appointments');
const paymentRoutes = require('./payments');
const walletRoutes = require('./wallets');
const medicalRecordRoutes = require('./medicalRecords');
const chatRoutes = require('./chats');
const notificationRoutes = require('./notifications');
const reviewRoutes = require('./reviews');

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallets', walletRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/chats', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nakes Link API',
    version: process.env.API_VERSION || '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      services: '/api/services',
      appointments: '/api/appointments',
      payments: '/api/payments',
      wallets: '/api/wallets',
      medical_records: '/api/medical-records',
      chats: '/api/chats',
      notifications: '/api/notifications',
      reviews: '/api/reviews'
    },
    documentation: process.env.API_DOCS_URL || '/docs'
  });
});

module.exports = router;