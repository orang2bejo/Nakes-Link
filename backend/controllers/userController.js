const { User, Service, Appointment, Review, Wallet } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
      include: [
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['current_balance', 'pending_balance', 'currency', 'status']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      full_name,
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      specialization,
      experience_years,
      education,
      certifications,
      working_hours,
      bio,
      languages
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {
      full_name,
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      bio,
      languages
    };

    // Add nakes-specific fields
    if (user.role === 'nakes') {
      updateData.specialization = specialization;
      updateData.experience_years = experience_years;
      updateData.education = education;
      updateData.certifications = certifications;
      updateData.working_hours = working_hours;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await user.update(updateData);

    // Get updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    
    // Upload to cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'avatars',
      public_id: `avatar_${userId}`,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto', format: 'auto' }
      ]
    });

    // Update user avatar
    await User.update(
      { avatar: result.secure_url },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar_url: result.secure_url
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await user.update({ password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let dashboardData = {};

    if (userRole === 'patient') {
      // Patient dashboard
      const [upcomingAppointments, recentAppointments, wallet] = await Promise.all([
        Appointment.findAll({
          where: {
            patient_id: userId,
            status: { [Op.in]: ['confirmed', 'pending'] },
            appointment_date: { [Op.gte]: new Date() }
          },
          include: [
            { model: User, as: 'nakes', attributes: ['id', 'full_name', 'avatar', 'specialization'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ],
          order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
          limit: 5
        }),
        Appointment.findAll({
          where: {
            patient_id: userId,
            status: 'completed'
          },
          include: [
            { model: User, as: 'nakes', attributes: ['id', 'full_name', 'avatar', 'specialization'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ],
          order: [['appointment_date', 'DESC']],
          limit: 5
        }),
        Wallet.findOne({
          where: { user_id: userId },
          attributes: ['current_balance', 'pending_balance', 'currency']
        })
      ]);

      dashboardData = {
        upcoming_appointments: upcomingAppointments,
        recent_appointments: recentAppointments,
        wallet: wallet || { current_balance: 0, pending_balance: 0, currency: 'IDR' },
        stats: {
          total_appointments: await Appointment.count({ where: { patient_id: userId } }),
          completed_appointments: await Appointment.count({ 
            where: { patient_id: userId, status: 'completed' } 
          })
        }
      };

    } else if (userRole === 'nakes') {
      // Nakes dashboard
      const [todayAppointments, upcomingAppointments, recentReviews, wallet] = await Promise.all([
        Appointment.findAll({
          where: {
            nakes_id: userId,
            appointment_date: new Date().toISOString().split('T')[0],
            status: { [Op.in]: ['confirmed', 'pending', 'in_progress'] }
          },
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name', 'avatar'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ],
          order: [['appointment_time', 'ASC']]
        }),
        Appointment.findAll({
          where: {
            nakes_id: userId,
            status: { [Op.in]: ['confirmed', 'pending'] },
            appointment_date: { [Op.gt]: new Date() }
          },
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name', 'avatar'] },
            { model: Service, as: 'service', attributes: ['id', 'name'] }
          ],
          order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
          limit: 5
        }),
        Review.findAll({
          where: { nakes_id: userId },
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name', 'avatar'] }
          ],
          order: [['created_at', 'DESC']],
          limit: 5
        }),
        Wallet.findOne({
          where: { user_id: userId },
          attributes: ['current_balance', 'pending_balance', 'currency']
        })
      ]);

      const stats = await Appointment.getAppointmentStats({ nakes_id: userId });
      const avgRating = await Review.getAverageRating({ nakes_id: userId });

      dashboardData = {
        today_appointments: todayAppointments,
        upcoming_appointments: upcomingAppointments,
        recent_reviews: recentReviews,
        wallet: wallet || { current_balance: 0, pending_balance: 0, currency: 'IDR' },
        stats: {
          ...stats,
          average_rating: avgRating,
          total_reviews: await Review.count({ where: { nakes_id: userId } })
        }
      };
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search nakes
exports.searchNakes = async (req, res) => {
  try {
    const {
      q,
      specialization,
      location,
      min_rating,
      max_price,
      availability_date,
      sort_by = 'rating',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      role: 'nakes',
      status: 'active',
      is_verified: true
    };

    // Text search
    if (q) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${q}%` } },
        { specialization: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Specialization filter
    if (specialization) {
      whereClause.specialization = { [Op.iLike]: `%${specialization}%` };
    }

    // Location filter
    if (location) {
      whereClause.address = { [Op.iLike]: `%${location}%` };
    }

    // Rating filter
    if (min_rating) {
      whereClause.average_rating = { [Op.gte]: parseFloat(min_rating) };
    }

    // Build order clause
    let orderClause = [];
    switch (sort_by) {
      case 'rating':
        orderClause = [['average_rating', 'DESC']];
        break;
      case 'experience':
        orderClause = [['experience_years', 'DESC']];
        break;
      case 'price_low':
        orderClause = [[{ model: Service, as: 'services' }, 'price', 'ASC']];
        break;
      case 'price_high':
        orderClause = [[{ model: Service, as: 'services' }, 'price', 'DESC']];
        break;
      default:
        orderClause = [['average_rating', 'DESC']];
    }

    const nakesList = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: 'services',
          where: max_price ? { price: { [Op.lte]: parseFloat(max_price) } } : {},
          required: max_price ? true : false,
          attributes: ['id', 'name', 'price', 'duration', 'description']
        },
        {
          model: Review,
          as: 'receivedReviews',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id', 'full_name', 'avatar', 'specialization', 'experience_years',
        'bio', 'average_rating', 'total_reviews', 'address', 'languages'
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // If availability date is specified, filter by available time slots
    if (availability_date) {
      const availableNakes = [];
      
      for (const nakes of nakesList.rows) {
        const existingAppointments = await Appointment.count({
          where: {
            nakes_id: nakes.id,
            appointment_date: availability_date,
            status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
          }
        });

        // Simple availability check - if less than 8 appointments, consider available
        if (existingAppointments < 8) {
          availableNakes.push(nakes);
        }
      }
      
      nakesList.rows = availableNakes;
      nakesList.count = availableNakes.length;
    }

    res.json({
      success: true,
      data: {
        nakes: nakesList.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(nakesList.count / limit),
          total_items: nakesList.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search nakes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get nakes details
exports.getNakesDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const nakes = await User.findOne({
      where: {
        id,
        role: 'nakes',
        status: 'active'
      },
      include: [
        {
          model: Service,
          as: 'services',
          where: { status: 'active' },
          required: false
        },
        {
          model: Review,
          as: 'receivedReviews',
          include: [
            { model: User, as: 'patient', attributes: ['id', 'full_name', 'avatar'] }
          ],
          order: [['created_at', 'DESC']],
          limit: 10
        }
      ],
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }
    });

    if (!nakes) {
      return res.status(404).json({
        success: false,
        message: 'Nakes not found'
      });
    }

    res.json({
      success: true,
      data: { nakes }
    });

  } catch (error) {
    console.error('Get nakes details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetTokenExpires
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.full_name,
        reset_url: resetUrl
      }
    });

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { token, new_password } = req.body;

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check for active appointments
    const activeAppointments = await Appointment.count({
      where: {
        [Op.or]: [
          { patient_id: userId },
          { nakes_id: userId }
        ],
        status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
      }
    });

    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active appointments'
      });
    }

    // Soft delete user
    await user.update({
      status: 'deleted',
      email: `deleted_${Date.now()}_${user.email}`,
      deleted_at: new Date()
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};