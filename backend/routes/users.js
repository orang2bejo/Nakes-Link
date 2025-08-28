const express = require('express');
const { User } = require('../models');
const { authorize, requireVerifiedNakes } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationToken'] }
  });

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', catchAsync(async (req, res) => {
  const {
    fullName,
    phone,
    dateOfBirth,
    gender,
    address,
    city,
    province,
    postalCode,
    specialization,
    experience,
    education,
    workplace
  } = req.body;

  const user = await User.findByPk(req.user.id);
  
  const updateData = {
    ...(fullName && { fullName }),
    ...(phone && { phone }),
    ...(dateOfBirth && { dateOfBirth }),
    ...(gender && { gender }),
    ...(address && { address }),
    ...(city && { city }),
    ...(province && { province }),
    ...(postalCode && { postalCode })
  };

  // Nakes specific fields
  if (user.role === 'nakes') {
    if (specialization) updateData.specialization = specialization;
    if (experience) updateData.experienceYears = experience;
    if (education) updateData.education = education;
    if (workplace) updateData.workplace = workplace;
  }

  await user.update(updateData);

  const updatedUser = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationToken'] }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
}));

/**
 * @route   GET /api/users/nakes
 * @desc    Get list of verified Nakes
 * @access  Public
 */
router.get('/nakes', catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    profession,
    city,
    specialization,
    search,
    sortBy = 'averageRating',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {
    role: 'nakes',
    isActive: true,
    documentsVerified: true
  };

  // Add filters
  if (profession) whereClause.profession = profession;
  if (city) whereClause.city = city;
  if (specialization) {
    whereClause.specialization = {
      [Op.iLike]: `%${specialization}%`
    };
  }
  if (search) {
    whereClause[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { specialization: { [Op.iLike]: `%${search}%` } },
      { profession: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: nakes } = await User.findAndCountAll({
    where: whereClause,
    attributes: {
      exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
    },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      nakes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

/**
 * @route   GET /api/users/nakes/:id
 * @desc    Get Nakes profile by ID
 * @access  Public
 */
router.get('/nakes/:id', catchAsync(async (req, res) => {
  const nakes = await User.findOne({
    where: {
      id: req.params.id,
      role: 'nakes',
      isActive: true,
      documentsVerified: true
    },
    attributes: {
      exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
    },
    include: [
      {
        association: 'services',
        where: { isActive: true },
        required: false
      }
    ]
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
}));

/**
 * @route   PUT /api/users/availability
 * @desc    Update Nakes availability
 * @access  Private (Nakes only)
 */
router.put('/availability', 
  authorize(['nakes']),
  requireVerifiedNakes,
  catchAsync(async (req, res) => {
    const { isAvailable, availabilitySchedule } = req.body;

    const user = await User.findByPk(req.user.id);
    
    const updateData = {};
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;
    if (availabilitySchedule) updateData.availabilitySchedule = availabilitySchedule;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        isAvailable: user.isAvailable,
        availabilitySchedule: user.availabilitySchedule
      }
    });
  })
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  const stats = {
    totalAppointments: user.totalAppointments || 0,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0
  };

  // Add role-specific stats
  if (user.role === 'nakes') {
    // Add Nakes specific statistics
    stats.experienceYears = user.experienceYears || 0;
    stats.isVerified = user.documentsVerified;
    stats.isAvailable = user.isAvailable;
  }

  res.json({
    success: true,
    data: { stats }
  });
}));

module.exports = router;