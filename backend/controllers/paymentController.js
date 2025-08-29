const { Payment, Appointment, User, Service, Wallet, WalletTransaction } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { createPayment, processPaymentCallback } = require('../services/paymentService');
const { sendNotification } = require('../services/notificationService');
const crypto = require('crypto');

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      appointment_id,
      payment_method,
      payment_provider = 'midtrans'
    } = req.body;

    const user_id = req.user.id;

    // Get appointment details
    const appointment = await Appointment.findByPk(appointment_id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name', 'email', 'phone'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the patient
    if (appointment.patient_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment can be paid
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be paid at this time'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: {
        appointment_id,
        status: { [Op.in]: ['pending', 'paid'] }
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this appointment',
        data: {
          payment_id: existingPayment.id,
          payment_url: existingPayment.payment_url,
          status: existingPayment.status
        }
      });
    }

    // Create payment
    const paymentData = {
      user_id,
      appointment_id,
      total_amount: appointment.total_amount,
      platform_fee: appointment.platform_fee,
      gateway_fee: Math.round(appointment.total_amount * 0.023), // 2.3% gateway fee
      net_amount: appointment.total_amount - appointment.platform_fee,
      currency: 'IDR',
      payment_method,
      payment_provider,
      description: `Payment for ${appointment.service.name} appointment`,
      customer_details: {
        first_name: appointment.patient.full_name,
        email: appointment.patient.email,
        phone: appointment.patient.phone
      },
      item_details: [{
        id: appointment.service.id,
        price: appointment.base_price,
        quantity: 1,
        name: appointment.service.name
      }]
    };

    if (appointment.emergency_fee > 0) {
      paymentData.item_details.push({
        id: 'emergency_fee',
        price: appointment.emergency_fee,
        quantity: 1,
        name: 'Emergency Fee'
      });
    }

    if (appointment.platform_fee > 0) {
      paymentData.item_details.push({
        id: 'platform_fee',
        price: appointment.platform_fee,
        quantity: 1,
        name: 'Platform Fee'
      });
    }

    const payment = await createPayment(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment_id: payment.id,
        payment_url: payment.payment_url,
        payment_token: payment.payment_token,
        amount: payment.total_amount,
        expires_at: payment.expires_at
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name'] },
            { model: User, as: 'nakes', attributes: ['id', 'full_name'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      payment.user_id === user_id ||
      (payment.appointment && payment.appointment.nakes_id === user_id) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user payments
exports.getUserPayments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, start_date, end_date } = req.query;
    const user_id = req.user.id;
    const offset = (page - 1) * limit;

    const whereClause = { user_id };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: User, as: 'nakes', attributes: ['id', 'full_name', 'avatar'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        payments: payments.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(payments.count / limit),
          total_items: payments.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Payment webhook callback
exports.paymentCallback = async (req, res) => {
  try {
    const signature = req.headers['x-callback-token'] || req.headers['x-signature'];
    const payload = req.body;

    // Verify webhook signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const orderId = payload.order_id;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    
    const signatureKey = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    if (signature !== signatureKey) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Process payment callback
    const result = await processPaymentCallback(payload);

    if (result.success) {
      res.json({ success: true, message: 'Callback processed successfully' });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel payment
exports.cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name'] },
            { model: User, as: 'nakes', attributes: ['id', 'full_name'] }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if payment can be cancelled
    if (!['pending'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be cancelled'
      });
    }

    // Update payment status
    await payment.update({
      status: 'cancelled',
      failure_reason: reason || 'Cancelled by user'
    });

    // Update appointment status if needed
    if (payment.appointment && payment.appointment.status === 'pending') {
      await payment.appointment.update({ status: 'cancelled' });
    }

    res.json({
      success: true,
      message: 'Payment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request refund
exports.requestRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason, refund_amount } = req.body;
    const user_id = req.user.id;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name'] },
            { model: User, as: 'nakes', attributes: ['id', 'full_name'] }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (payment.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if refund can be requested
    if (!payment.canBeRefunded()) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be refunded'
      });
    }

    const refundAmountToProcess = refund_amount || payment.total_amount;

    // Validate refund amount
    if (refundAmountToProcess > payment.total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Update payment with refund request
    await payment.update({
      refund_status: 'requested',
      refund_amount: refundAmountToProcess,
      refund_reason: reason,
      refund_requested_at: new Date()
    });

    // Send notification to admin
    await sendNotification({
      user_id: 'admin', // This should be handled differently in production
      type: 'refund_requested',
      title: 'Refund Request',
      message: `Refund request for payment ${payment.id}`,
      data: {
        payment_id: payment.id,
        refund_amount: refundAmountToProcess,
        reason
      },
      priority: 'normal'
    });

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        refund_amount: refundAmountToProcess,
        status: 'requested'
      }
    });

  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Process refund (admin only)
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // action: 'approve' or 'reject'

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const payment = await Payment.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name'] },
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: User, as: 'nakes', attributes: ['id', 'full_name'] }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.refund_status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'No pending refund request found'
      });
    }

    if (action === 'approve') {
      // Process refund
      const refundResult = await payment.processRefund();
      
      if (refundResult.success) {
        // Create wallet transaction for refund
        const wallet = await Wallet.findOne({ where: { user_id: payment.user_id } });
        if (wallet) {
          await WalletTransaction.create({
            wallet_id: wallet.id,
            user_id: payment.user_id,
            type: 'refund',
            amount: payment.refund_amount,
            description: `Refund for payment ${payment.id}`,
            reference_id: payment.id,
            status: 'completed'
          });

          await wallet.addBalance(payment.refund_amount);
        }

        await payment.update({
          refund_status: 'completed',
          refunded_at: new Date(),
          admin_notes
        });

        // Send notification to user
        await sendNotification({
          user_id: payment.user_id,
          type: 'refund_approved',
          title: 'Refund Approved',
          message: `Your refund of ${payment.refund_amount} has been processed`,
          data: {
            payment_id: payment.id,
            refund_amount: payment.refund_amount
          }
        });

        res.json({
          success: true,
          message: 'Refund processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to process refund',
          error: refundResult.error
        });
      }
    } else if (action === 'reject') {
      await payment.update({
        refund_status: 'rejected',
        admin_notes
      });

      // Send notification to user
      await sendNotification({
        user_id: payment.user_id,
        type: 'refund_rejected',
        title: 'Refund Rejected',
        message: 'Your refund request has been rejected',
        data: {
          payment_id: payment.id,
          reason: admin_notes
        }
      });

      res.json({
        success: true,
        message: 'Refund request rejected'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const { start_date, end_date, nakes_id } = req.query;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const whereClause = {};
    
    if (user_role === 'patient') {
      whereClause.user_id = user_id;
    } else if (user_role === 'nakes') {
      // Get payments for appointments with this nakes
      const appointments = await Appointment.findAll({
        where: { nakes_id: user_id },
        attributes: ['id']
      });
      whereClause.appointment_id = {
        [Op.in]: appointments.map(apt => apt.id)
      };
    } else if (nakes_id && user_role === 'admin') {
      const appointments = await Appointment.findAll({
        where: { nakes_id },
        attributes: ['id']
      });
      whereClause.appointment_id = {
        [Op.in]: appointments.map(apt => apt.id)
      };
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const stats = {
      total_payments: await Payment.count({ where: whereClause }),
      successful_payments: await Payment.count({ 
        where: { ...whereClause, status: 'paid' } 
      }),
      pending_payments: await Payment.count({ 
        where: { ...whereClause, status: 'pending' } 
      }),
      failed_payments: await Payment.count({ 
        where: { ...whereClause, status: 'failed' } 
      }),
      total_amount: await Payment.sum('total_amount', { 
        where: { ...whereClause, status: 'paid' } 
      }) || 0,
      total_refunds: await Payment.sum('refund_amount', { 
        where: { ...whereClause, refund_status: 'completed' } 
      }) || 0
    };

    stats.success_rate = stats.total_payments > 0 
      ? (stats.successful_payments / stats.total_payments * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};