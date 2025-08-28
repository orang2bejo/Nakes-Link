const express = require('express');
const { Service, User } = require('../models');
const { authenticateToken, authorize, requireVerifiedNakes, optionalAuth } = require('../middleware/auth');
const { catchAsync, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all active services with filters
 * @access  Public
 */
router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    city,
    minPrice,
    maxPrice,
    search,
    nakesId,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {
    isActive: true
  };

  // Add filters
  if (category) whereClause.category = category;
  if (nakesId) whereClause.nakesId = nakesId;
  if (minPrice) whereClause.price = { [Op.gte]: parseFloat(minPrice) };
  if (maxPrice) {
    whereClause.price = {
      ...whereClause.price,
      [Op.lte]: parseFloat(maxPrice)
    };
  }
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const nakesWhereClause = {
    role: 'nakes',
    isActive: true,
    documentsVerified: true
  };

  if (city) nakesWhereClause.city = city;

  const { count, rows: services } = await Service.findAndCountAll({
    where: whereClause,
    include: [
      {
        association: 'nakes',
        where: nakesWhereClause,
        attributes: {
          exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
        }
      }
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      services,
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
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id', catchAsync(async (req, res) => {
  const service = await Service.findOne({
    where: {
      id: req.params.id,
      isActive: true
    },
    include: [
      {
        association: 'nakes',
        where: {
          role: 'nakes',
          isActive: true,
          documentsVerified: true
        },
        attributes: {
          exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
        }
      }
    ]
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  res.json({
    success: true,
    data: { service }
  });
}));

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Nakes only)
 */
router.post('/',
  authenticateToken,
  authorize(['nakes']),
  requireVerifiedNakes,
  catchAsync(async (req, res) => {
    const {
      name,
      description,
      category,
      price,
      duration,
      location,
      requirements,
      isHomeVisit,
      maxDistance,
      availableDays,
      availableHours
    } = req.body;

    // Validation
    if (!name || !description || !category || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, description, category, price, duration'
      });
    }

    const service = await Service.create({
      name,
      description,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      location,
      requirements,
      isHomeVisit: isHomeVisit || false,
      maxDistance: maxDistance ? parseInt(maxDistance) : null,
      availableDays,
      availableHours,
      nakesId: req.user.id,
      isActive: true
    });

    // Load service with nakes data
    const serviceWithNakes = await Service.findByPk(service.id, {
      include: [
        {
          association: 'nakes',
          attributes: {
            exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
          }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service: serviceWithNakes }
    });
  })
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Nakes only - own services)
 */
router.put('/:id',
  authenticateToken,
  authorize(['nakes']),
  requireVerifiedNakes,
  catchAsync(async (req, res) => {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Check ownership
    if (service.nakesId !== req.user.id) {
      throw new AuthorizationError('You can only update your own services');
    }

    const {
      name,
      description,
      category,
      price,
      duration,
      location,
      requirements,
      isHomeVisit,
      maxDistance,
      availableDays,
      availableHours,
      isActive
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (price) updateData.price = parseFloat(price);
    if (duration) updateData.duration = parseInt(duration);
    if (location) updateData.location = location;
    if (requirements) updateData.requirements = requirements;
    if (typeof isHomeVisit === 'boolean') updateData.isHomeVisit = isHomeVisit;
    if (maxDistance) updateData.maxDistance = parseInt(maxDistance);
    if (availableDays) updateData.availableDays = availableDays;
    if (availableHours) updateData.availableHours = availableHours;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await service.update(updateData);

    // Load updated service with nakes data
    const updatedService = await Service.findByPk(service.id, {
      include: [
        {
          association: 'nakes',
          attributes: {
            exclude: ['password', 'refreshToken', 'emailVerificationToken', 'nik']
          }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service: updatedService }
    });
  })
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (soft delete)
 * @access  Private (Nakes only - own services)
 */
router.delete('/:id',
  authenticateToken,
  authorize(['nakes']),
  requireVerifiedNakes,
  catchAsync(async (req, res) => {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Check ownership
    if (service.nakesId !== req.user.id) {
      throw new AuthorizationError('You can only delete your own services');
    }

    await service.update({ isActive: false });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  })
);

/**
 * @route   GET /api/services/my/list
 * @desc    Get current Nakes services
 * @access  Private (Nakes only)
 */
router.get('/my/list',
  authenticateToken,
  authorize(['nakes']),
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      isActive,
      category
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      nakesId: req.user.id
    };

    if (typeof isActive === 'string') {
      whereClause.isActive = isActive === 'true';
    }
    if (category) whereClause.category = category;

    const { count, rows: services } = await Service.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/services/categories
 * @desc    Get service categories
 * @access  Public
 */
router.get('/categories/list', catchAsync(async (req, res) => {
  const categories = [
    'konsultasi_umum',
    'pemeriksaan_kesehatan',
    'perawatan_luka',
    'fisioterapi',
    'konsultasi_gizi',
    'vaksinasi',
    'pemeriksaan_kehamilan',
    'perawatan_lansia',
    'terapi_okupasi',
    'konsultasi_kesehatan_mental',
    'pemeriksaan_laboratorium',
    'radiologi',
    'farmasi_klinis',
    'promosi_kesehatan',
    'kesehatan_lingkungan'
  ];

  // Get category statistics
  const categoryStats = await Service.findAll({
    attributes: [
      'category',
      [Service.sequelize.fn('COUNT', Service.sequelize.col('id')), 'count']
    ],
    where: { isActive: true },
    group: ['category'],
    raw: true
  });

  const categoriesWithStats = categories.map(category => {
    const stat = categoryStats.find(s => s.category === category);
    return {
      name: category,
      count: stat ? parseInt(stat.count) : 0
    };
  });

  res.json({
    success: true,
    data: { categories: categoriesWithStats }
  });
}));

module.exports = router;