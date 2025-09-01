/**
 * Payment Tests
 * Test suite for payment processing API endpoints
 */

const request = require('supertest');
const app = require('../app');
const { User, Appointment, Service, Payment, Transaction } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock payment gateways
jest.mock('../services/midtransService');
jest.mock('../services/xenditService');

const midtransService = require('../services/midtransService');
const xenditService = require('../services/xenditService');

describe('Payments', () => {
  let patientUser, nakesUser, service, appointment, payment;
  let patientToken, nakesToken;

  beforeEach(async () => {
    // Clean up database
    await Transaction.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Appointment.destroy({ where: {} });
    await Service.destroy({ where: {} });
    await User.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test users
    patientUser = await User.create({
      email: 'patient@test.com',
      password: hashedPassword,
      fullName: 'Test Patient',
      full_name: 'Test Patient',
      phone: '+6281234567890',
      role: 'patient',
      status: 'active',
      walletBalance: 500000
    });

    nakesUser = await User.create({
      email: 'nakes@test.com',
      password: hashedPassword,
      fullName: 'Dr. Test Nakes',
      full_name: 'Dr. Test Nakes',
      phone: '+6281234567891',
      role: 'nakes',
      status: 'active',
      specialization: 'General Practitioner',
      documentsVerified: true,
      walletBalance: 0
    });

    // Create test service
    service = await Service.create({
      name: 'General Consultation',
      description: 'General health consultation',
      category: 'consultation',
      price: 100000,
      duration: 30,
      isActive: true,
      providerId: nakesUser.id
    });

    // Create test appointment
    appointment = await Appointment.create({
      patientId: patientUser.id,
      nakesId: nakesUser.id,
      serviceId: service.id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      appointmentTime: '10:00',
      status: 'confirmed',
      totalAmount: service.price,
      paymentStatus: 'pending'
    });

    // Create test payment
    payment = await Payment.create({
      appointmentId: appointment.id,
      patientId: patientUser.id,
      amount: service.price,
      paymentMethod: 'wallet',
      status: 'pending'
    });

    // Generate tokens
    patientToken = jwt.sign(
      { id: patientUser.id, role: patientUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    nakesToken = jwt.sign(
      { id: nakesUser.id, role: nakesUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await Transaction.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Appointment.destroy({ where: {} });
    await Service.destroy({ where: {} });
    await User.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create', () => {
    it('should create payment for appointment', async () => {
      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'midtrans',
        amount: service.price
      };

      midtransService.createTransaction.mockResolvedValue({
        success: true,
        data: {
          token: 'test_token',
          redirect_url: 'https://test.midtrans.com/payment'
        }
      });

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.appointmentId).toBe(appointment.id);
      expect(response.body.data.payment.paymentMethod).toBe('midtrans');
      expect(response.body.data.paymentUrl).toBeDefined();
    });

    it('should create payment with Xendit', async () => {
      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'xendit',
        amount: service.price
      };

      xenditService.createInvoice.mockResolvedValue({
        success: true,
        data: {
          id: 'xendit_invoice_id',
          invoice_url: 'https://checkout.xendit.co/test'
        }
      });

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.paymentMethod).toBe('xendit');
      expect(xenditService.createInvoice).toHaveBeenCalled();
    });

    it('should process wallet payment immediately', async () => {
      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'wallet',
        amount: service.price
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('completed');
      
      // Check wallet balance was deducted
      const updatedPatient = await User.findByPk(patientUser.id);
      expect(updatedPatient.walletBalance).toBe(patientUser.walletBalance - service.price);
    });

    it('should reject wallet payment with insufficient balance', async () => {
      // Set low wallet balance
      await patientUser.update({ walletBalance: 50000 });

      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'wallet',
        amount: service.price
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('insufficient');
    });

    it('should reject payment for non-existent appointment', async () => {
      const paymentData = {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        paymentMethod: 'wallet',
        amount: service.price
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject payment for other users appointment', async () => {
      // Create another patient
      const hashedPassword = await bcrypt.hash('password123', 12);
      const otherPatient = await User.create({
        email: 'other@test.com',
        password: hashedPassword,
        fullName: 'Other Patient',
        full_name: 'Other Patient',
        phone: '+6281234567899',
        role: 'patient',
        status: 'active'
      });

      const otherToken = jwt.sign(
        { id: otherPatient.id, role: otherPatient.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'wallet',
        amount: service.price
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${otherToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments', () => {
    it('should get user payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeInstanceOf(Array);
      expect(response.body.data.payments.length).toBeGreaterThan(0);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/payments?status=pending')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every(payment => 
        payment.status === 'pending'
      )).toBe(true);
    });

    it('should filter payments by payment method', async () => {
      const response = await request(app)
        .get('/api/payments?paymentMethod=wallet')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every(payment => 
        payment.paymentMethod === 'wallet'
      )).toBe(true);
    });

    it('should implement pagination', async () => {
      const response = await request(app)
        .get('/api/payments?page=1&limit=5')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/payments/:id', () => {
    it('should get specific payment', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.id).toBe(payment.id);
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/webhook/midtrans', () => {
    it('should handle successful Midtrans webhook', async () => {
      const webhookData = {
        order_id: payment.id,
        transaction_status: 'settlement',
        payment_type: 'credit_card',
        gross_amount: service.price.toString()
      };

      midtransService.verifySignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payments/webhook/midtrans')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check payment status was updated
      const updatedPayment = await Payment.findByPk(payment.id);
      expect(updatedPayment.status).toBe('completed');
    });

    it('should handle failed Midtrans webhook', async () => {
      const webhookData = {
        order_id: payment.id,
        transaction_status: 'deny',
        payment_type: 'credit_card',
        gross_amount: service.price.toString()
      };

      midtransService.verifySignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payments/webhook/midtrans')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check payment status was updated
      const updatedPayment = await Payment.findByPk(payment.id);
      expect(updatedPayment.status).toBe('failed');
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookData = {
        order_id: payment.id,
        transaction_status: 'settlement',
        payment_type: 'credit_card',
        gross_amount: service.price.toString()
      };

      midtransService.verifySignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/payments/webhook/midtrans')
        .send(webhookData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/webhook/xendit', () => {
    it('should handle successful Xendit webhook', async () => {
      const webhookData = {
        external_id: payment.id,
        status: 'PAID',
        amount: service.price
      };

      xenditService.verifyWebhook.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payments/webhook/xendit')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check payment status was updated
      const updatedPayment = await Payment.findByPk(payment.id);
      expect(updatedPayment.status).toBe('completed');
    });

    it('should handle expired Xendit webhook', async () => {
      const webhookData = {
        external_id: payment.id,
        status: 'EXPIRED',
        amount: service.price
      };

      xenditService.verifyWebhook.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payments/webhook/xendit')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check payment status was updated
      const updatedPayment = await Payment.findByPk(payment.id);
      expect(updatedPayment.status).toBe('expired');
    });
  });

  describe('POST /api/payments/wallet/topup', () => {
    it('should create wallet top-up payment', async () => {
      const topupData = {
        amount: 200000,
        paymentMethod: 'midtrans'
      };

      midtransService.createTransaction.mockResolvedValue({
        success: true,
        data: {
          token: 'test_token',
          redirect_url: 'https://test.midtrans.com/payment'
        }
      });

      const response = await request(app)
        .post('/api/payments/wallet/topup')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(topupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.amount).toBe(topupData.amount);
      expect(response.body.data.payment.type).toBe('topup');
    });

    it('should validate minimum top-up amount', async () => {
      const topupData = {
        amount: 5000, // Below minimum
        paymentMethod: 'midtrans'
      };

      const response = await request(app)
        .post('/api/payments/wallet/topup')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(topupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('minimum');
    });

    it('should validate maximum top-up amount', async () => {
      const topupData = {
        amount: 50000000, // Above maximum
        paymentMethod: 'midtrans'
      };

      const response = await request(app)
        .post('/api/payments/wallet/topup')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(topupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('maximum');
    });
  });

  describe('POST /api/payments/wallet/withdraw', () => {
    beforeEach(async () => {
      // Set sufficient wallet balance for nakes
      await nakesUser.update({ walletBalance: 1000000 });
    });

    it('should create withdrawal request for nakes', async () => {
      const withdrawData = {
        amount: 500000,
        bankAccount: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountName: 'Dr. Test Nakes'
        }
      };

      const response = await request(app)
        .post('/api/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(withdrawData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawal.amount).toBe(withdrawData.amount);
      expect(response.body.data.withdrawal.status).toBe('pending');
    });

    it('should reject withdrawal with insufficient balance', async () => {
      const withdrawData = {
        amount: 2000000, // More than balance
        bankAccount: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountName: 'Dr. Test Nakes'
        }
      };

      const response = await request(app)
        .post('/api/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${nakesToken}`)
        .send(withdrawData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('insufficient');
    });

    it('should reject withdrawal from patient', async () => {
      const withdrawData = {
        amount: 100000,
        bankAccount: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountName: 'Test Patient'
        }
      };

      const response = await request(app)
        .post('/api/payments/wallet/withdraw')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(withdrawData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/wallet/balance', () => {
    it('should get wallet balance', async () => {
      const response = await request(app)
        .get('/api/payments/wallet/balance')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(patientUser.walletBalance);
    });
  });

  describe('GET /api/payments/wallet/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      await Transaction.create({
        userId: patientUser.id,
        type: 'debit',
        amount: 100000,
        description: 'Payment for consultation',
        status: 'completed'
      });

      await Transaction.create({
        userId: patientUser.id,
        type: 'credit',
        amount: 200000,
        description: 'Wallet top-up',
        status: 'completed'
      });
    });

    it('should get wallet transactions', async () => {
      const response = await request(app)
        .get('/api/payments/wallet/transactions')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/payments/wallet/transactions?type=credit')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.every(tx => 
        tx.type === 'credit'
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle payment gateway errors gracefully', async () => {
      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'midtrans',
        amount: service.price
      };

      midtransService.createTransaction.mockRejectedValue(new Error('Gateway error'));

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('error');
    });

    it('should validate payment amounts', async () => {
      const paymentData = {
        appointmentId: appointment.id,
        paymentMethod: 'wallet',
        amount: -100000 // Negative amount
      };

      const response = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});