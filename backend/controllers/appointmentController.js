const { Appointment, User, Service, Payment, ChatRoom, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const moment = require('moment');
const { sendNotification } = require('../services/notificationService');
const { createPayment } = require('../services/paymentService');
const { createChatRoom } = require('../services/chatService');

// Create new appointment
exports.createAppointment = async (req, res) => {
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
      nakes_id,
      service_id,
      appointment_date,
      appointment_time,
      type,
      location,
      coordinates,
      symptoms,
      notes,
      emergency_level
    } = req.body;

    const patient_id = req.user.id;

    // Validate nakes exists and is active
    const nakes = await User.findOne({
      where: {
        id: nakes_id,
        role: 'nakes',
        status: 'active',
        is_verified: true
      }
    });

    if (!nakes) {
      return res.status(404).json({
        success: false,
        message: 'Nakes not found or not available'
      });
    }

    // Validate service exists and belongs to nakes
    const service = await Service.findOne({
      where: {
        id: service_id,
        nakes_id: nakes_id,
        status: 'active'
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Check for scheduling conflicts
    const appointmentDateTime = moment(`${appointment_date} ${appointment_time}`, 'YYYY-MM-DD HH:mm');
    const conflictCheck = await Appointment.findOne({
      where: {
        nakes_id: nakes_id,
        appointment_date: appointment_date,
        appointment_time: {
          [Op.between]: [
            appointmentDateTime.clone().subtract(service.duration || 60, 'minutes').format('HH:mm'),
            appointmentDateTime.clone().add(service.duration || 60, 'minutes').format('HH:mm')
          ]
        },
        status: {
          [Op.in]: ['pending', 'confirmed', 'in_progress']
        }
      }
    });

    if (conflictCheck) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    // Calculate pricing
    const basePrice = service.price;
    const emergencyFee = emergency_level && emergency_level !== 'none' ? service.emergency_fee || 0 : 0;
    const platformFee = Math.round(basePrice * 0.05); // 5% platform fee
    const totalAmount = basePrice + emergencyFee + platformFee;

    // Create appointment
    const appointment = await Appointment.create({
      patient_id,
      nakes_id,
      service_id,
      appointment_date,
      appointment_time,
      type: type || 'consultation',
      location,
      coordinates,
      symptoms,
      notes,
      emergency_level: emergency_level || 'none',
      duration: service.duration || 60,
      base_price: basePrice,
      emergency_fee: emergencyFee,
      platform_fee: platformFee,
      total_amount: totalAmount,
      status: emergency_level === 'critical' ? 'confirmed' : 'pending'
    });

    // Create chat room for appointment
    const chatRoom = await createChatRoom({
      type: 'appointment',
      appointment_id: appointment.id,
      created_by: patient_id,
      participant_ids: [patient_id, nakes_id]
    });

    // Create payment if not emergency
    let payment = null;
    if (emergency_level !== 'critical') {
      payment = await createPayment({
        user_id: patient_id,
        appointment_id: appointment.id,
        amount: totalAmount,
        description: `Payment for ${service.name} appointment`
      });
    }

    // Send notifications
    await sendNotification({
      user_id: nakes_id,
      type: 'appointment_booked',
      title: 'New Appointment Request',
      message: `You have a new appointment request from ${req.user.full_name}`,
      data: {
        appointment_id: appointment.id,
        patient_name: req.user.full_name,
        service_name: service.name,
        appointment_date,
        appointment_time
      },
      priority: emergency_level === 'critical' ? 'urgent' : 'normal'
    });

    // Load appointment with relations
    const appointmentWithDetails = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name', 'phone', 'avatar'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name', 'phone', 'avatar', 'specialization'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'description', 'price'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment: appointmentWithDetails,
        chat_room_id: chatRoom.id,
        payment: payment ? {
          id: payment.id,
          amount: payment.total_amount,
          payment_url: payment.payment_url
        } : null
      }
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Set user filter based on role
    if (userRole === 'patient') {
      whereClause.patient_id = userId;
    } else if (userRole === 'nakes') {
      whereClause.nakes_id = userId;
    }

    // Add filters
    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (start_date && end_date) {
      whereClause.appointment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name', 'phone', 'avatar'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name', 'phone', 'avatar', 'specialization'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'description', 'price'] }
      ],
      order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        appointments: appointments.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(appointments.count / limit),
          total_items: appointments.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get appointment details
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name', 'phone', 'avatar', 'date_of_birth'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name', 'phone', 'avatar', 'specialization', 'experience_years'] },
        { model: Service, as: 'service' },
        { model: Payment, as: 'payments' },
        { model: ChatRoom, as: 'chatRoom', attributes: ['id', 'status'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      (userRole === 'patient' && appointment.patient_id === userId) ||
      (userRole === 'nakes' && appointment.nakes_id === userId) ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
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
    const { status, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization based on status change
    let isAuthorized = false;
    if (status === 'confirmed' && userRole === 'nakes' && appointment.nakes_id === userId) {
      isAuthorized = true;
    } else if (status === 'cancelled' && 
               ((userRole === 'patient' && appointment.patient_id === userId) ||
                (userRole === 'nakes' && appointment.nakes_id === userId))) {
      isAuthorized = true;
    } else if (['in_progress', 'completed'].includes(status) && 
               userRole === 'nakes' && appointment.nakes_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment status'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled', 'rescheduled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': [],
      'rescheduled': ['confirmed', 'cancelled']
    };

    if (!validTransitions[appointment.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${appointment.status} to ${status}`
      });
    }

    // Update appointment
    const updateData = { status };
    
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = userId;
      updateData.cancellation_reason = reason;
    } else if (status === 'in_progress') {
      updateData.actual_start_time = new Date();
    } else if (status === 'completed') {
      updateData.actual_end_time = new Date();
    }

    await appointment.update(updateData);

    // Send notifications
    const notificationData = {
      type: `appointment_${status}`,
      data: {
        appointment_id: appointment.id,
        service_name: appointment.service.name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time
      }
    };

    if (userRole === 'nakes') {
      // Notify patient
      await sendNotification({
        user_id: appointment.patient_id,
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your appointment with ${appointment.nakes.full_name} has been ${status}`,
        ...notificationData
      });
    } else if (userRole === 'patient') {
      // Notify nakes
      await sendNotification({
        user_id: appointment.nakes_id,
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Appointment with ${appointment.patient.full_name} has been ${status}`,
        ...notificationData
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: { appointment }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
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
    const { new_date, new_time, reason } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'full_name'] },
        { model: User, as: 'nakes', attributes: ['id', 'full_name'] },
        { model: Service, as: 'service' }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user can reschedule
    if (!appointment.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be rescheduled'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.patient_id === userId || 
      appointment.nakes_id === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check for conflicts on new time
    const newDateTime = moment(`${new_date} ${new_time}`, 'YYYY-MM-DD HH:mm');
    const conflictCheck = await Appointment.findOne({
      where: {
        nakes_id: appointment.nakes_id,
        appointment_date: new_date,
        appointment_time: {
          [Op.between]: [
            newDateTime.clone().subtract(appointment.duration, 'minutes').format('HH:mm'),
            newDateTime.clone().add(appointment.duration, 'minutes').format('HH:mm')
          ]
        },
        status: {
          [Op.in]: ['pending', 'confirmed', 'in_progress']
        },
        id: { [Op.ne]: appointment.id }
      }
    });

    if (conflictCheck) {
      return res.status(409).json({
        success: false,
        message: 'New time slot is not available'
      });
    }

    // Update appointment
    await appointment.update({
      appointment_date: new_date,
      appointment_time: new_time,
      status: 'rescheduled',
      reschedule_reason: reason,
      rescheduled_at: new Date(),
      rescheduled_by: userId
    });

    // Send notifications
    const otherUserId = userId === appointment.patient_id ? appointment.nakes_id : appointment.patient_id;
    const otherUserName = userId === appointment.patient_id ? appointment.nakes.full_name : appointment.patient.full_name;
    
    await sendNotification({
      user_id: otherUserId,
      type: 'appointment_rescheduled',
      title: 'Appointment Rescheduled',
      message: `Your appointment has been rescheduled to ${new_date} at ${new_time}`,
      data: {
        appointment_id: appointment.id,
        new_date,
        new_time,
        reason
      }
    });

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { nakes_id, date, service_id } = req.query;

    if (!nakes_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Nakes ID and date are required'
      });
    }

    // Get nakes working hours
    const nakes = await User.findByPk(nakes_id, {
      attributes: ['id', 'working_hours']
    });

    if (!nakes) {
      return res.status(404).json({
        success: false,
        message: 'Nakes not found'
      });
    }

    // Get service duration
    let serviceDuration = 60; // default 60 minutes
    if (service_id) {
      const service = await Service.findByPk(service_id, {
        attributes: ['duration']
      });
      if (service && service.duration) {
        serviceDuration = service.duration;
      }
    }

    // Get existing appointments for the date
    const existingAppointments = await Appointment.findAll({
      where: {
        nakes_id,
        appointment_date: date,
        status: {
          [Op.in]: ['pending', 'confirmed', 'in_progress']
        }
      },
      attributes: ['appointment_time', 'duration']
    });

    // Generate available time slots
    const workingHours = nakes.working_hours || {
      start: '08:00',
      end: '17:00',
      break_start: '12:00',
      break_end: '13:00'
    };

    const availableSlots = [];
    const startTime = moment(`${date} ${workingHours.start}`, 'YYYY-MM-DD HH:mm');
    const endTime = moment(`${date} ${workingHours.end}`, 'YYYY-MM-DD HH:mm');
    const breakStart = moment(`${date} ${workingHours.break_start}`, 'YYYY-MM-DD HH:mm');
    const breakEnd = moment(`${date} ${workingHours.break_end}`, 'YYYY-MM-DD HH:mm');

    let currentTime = startTime.clone();

    while (currentTime.isBefore(endTime)) {
      const slotEnd = currentTime.clone().add(serviceDuration, 'minutes');
      
      // Skip if slot overlaps with break time
      if (currentTime.isBefore(breakEnd) && slotEnd.isAfter(breakStart)) {
        currentTime = breakEnd.clone();
        continue;
      }

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = moment(`${date} ${appointment.appointment_time}`, 'YYYY-MM-DD HH:mm');
        const appointmentEnd = appointmentStart.clone().add(appointment.duration || 60, 'minutes');
        
        return currentTime.isBefore(appointmentEnd) && slotEnd.isAfter(appointmentStart);
      });

      if (!hasConflict && slotEnd.isSameOrBefore(endTime)) {
        availableSlots.push({
          time: currentTime.format('HH:mm'),
          end_time: slotEnd.format('HH:mm'),
          duration: serviceDuration
        });
      }

      currentTime.add(30, 'minutes'); // 30-minute intervals
    }

    res.json({
      success: true,
      data: {
        date,
        available_slots: availableSlots,
        working_hours: workingHours
      }
    });

  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get appointment statistics
exports.getAppointmentStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = {};
    
    if (userRole === 'patient') {
      whereClause.patient_id = userId;
    } else if (userRole === 'nakes') {
      whereClause.nakes_id = userId;
    }

    if (start_date && end_date) {
      whereClause.appointment_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const stats = await Appointment.getAppointmentStats(whereClause);

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};