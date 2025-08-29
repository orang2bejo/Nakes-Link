const { Service, User, Appointment, Review } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Create new service
exports.createService = async (req, res) => {
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
      name,
      description,
      category,
      price,
      duration,
      location_type,
      emergency_fee,
      requirements,
      preparation_instructions,
      tags
    } = req.body;

    const nakes_id = req.user.id;

    // Verify user is a nakes
    if (req.user.role !== 'nakes') {
      return res.status(403).json({
        success: false,
        message: 'Only healthcare providers can create services'
      });
    }

    // Check if nakes is verified
    if (!req.user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Account must be verified to create services'
      });
    }

    const service = await Service.create({
      nakes_id,
      name,
      description,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      location_type,
      emergency_fee: emergency_fee ? parseFloat(emergency_fee) : 0,
      requirements,
      preparation_instructions,
      tags: tags || [],
      status: 'active'
    });

    // Load service with nakes details
    const serviceWithDetails = await Service.findByPk(service.id, {
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service: serviceWithDetails }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get services
exports.getServices = async (req, res) => {
  try {
    const {
      category,
      location_type,
      min_price,
      max_price,
      nakes_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'active' };

    // Apply filters
    if (category) {
      whereClause.category = category;
    }

    if (location_type) {
      whereClause.location_type = location_type;
    }

    if (min_price || max_price) {
      whereClause.price = {};
      if (min_price) whereClause.price[Op.gte] = parseFloat(min_price);
      if (max_price) whereClause.price[Op.lte] = parseFloat(max_price);
    }

    if (nakes_id) {
      whereClause.nakes_id = nakes_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build order clause
    const validSortFields = ['created_at', 'price', 'name', 'average_rating'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const services = await Service.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization', 'avatar', 'average_rating', 'experience_years'],
          where: { status: 'active', is_verified: true }
        }
      ],
      order: [[sortField, sortDirection]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        services: services.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(services.count / limit),
          total_items: services.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get service details
exports.getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({
      where: { id, status: 'active' },
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: {
            exclude: ['password', 'reset_password_token', 'reset_password_expires']
          },
          where: { status: 'active' }
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'patient',
              attributes: ['id', 'full_name', 'avatar']
            }
          ],
          where: { status: 'approved' },
          required: false,
          order: [['created_at', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get service statistics
    const stats = {
      total_appointments: await Appointment.count({
        where: { service_id: service.id }
      }),
      completed_appointments: await Appointment.count({
        where: { service_id: service.id, status: 'completed' }
      }),
      average_rating: service.average_rating || 0,
      total_reviews: await Review.count({
        where: { service_id: service.id, status: 'approved' }
      })
    };

    res.json({
      success: true,
      data: {
        service,
        stats
      }
    });

  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
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
    const {
      name,
      description,
      category,
      price,
      duration,
      location_type,
      emergency_fee,
      requirements,
      preparation_instructions,
      tags,
      status
    } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check authorization
    if (service.nakes_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (location_type !== undefined) updateData.location_type = location_type;
    if (emergency_fee !== undefined) updateData.emergency_fee = parseFloat(emergency_fee);
    if (requirements !== undefined) updateData.requirements = requirements;
    if (preparation_instructions !== undefined) updateData.preparation_instructions = preparation_instructions;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined && req.user.role === 'admin') updateData.status = status;

    await service.update(updateData);

    // Get updated service with details
    const updatedService = await Service.findByPk(id, {
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service: updatedService }
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check authorization
    if (service.nakes_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check for active appointments
    const activeAppointments = await Appointment.count({
      where: {
        service_id: id,
        status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
      }
    });

    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service with active appointments'
      });
    }

    // Soft delete
    await service.update({ status: 'deleted' });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload service images
exports.uploadServiceImages = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check authorization
    if (service.nakes_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async (file, index) => {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'services',
        public_id: `service_${id}_${index}_${Date.now()}`,
        transformation: [
          { width: 800, height: 600, crop: 'fill' },
          { quality: 'auto', format: 'auto' }
        ]
      });
      return result.secure_url;
    });

    const imageUrls = await Promise.all(uploadPromises);
    
    // Update service with new images
    const currentImages = service.images || [];
    const updatedImages = [...currentImages, ...imageUrls];
    
    await service.update({ images: updatedImages });

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        uploaded_images: imageUrls,
        total_images: updatedImages.length
      }
    });

  } catch (error) {
    console.error('Upload service images error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove service image
exports.removeServiceImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check authorization
    if (service.nakes_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const currentImages = service.images || [];
    const updatedImages = currentImages.filter(img => img !== image_url);
    
    await service.update({ images: updatedImages });

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: {
        remaining_images: updatedImages.length
      }
    });

  } catch (error) {
    console.error('Remove service image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get service categories
exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.findAll({
      attributes: ['category'],
      where: { status: 'active' },
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(item => item.category).filter(Boolean);

    res.json({
      success: true,
      data: { categories: categoryList }
    });

  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get popular services
exports.getPopularServices = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularServices = await Service.findAll({
      where: { status: 'active' },
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization', 'avatar'],
          where: { status: 'active', is_verified: true }
        },
        {
          model: Appointment,
          as: 'appointments',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            Service.sequelize.fn('COUNT', Service.sequelize.col('appointments.id')),
            'appointment_count'
          ]
        ]
      },
      group: ['Service.id', 'nakes.id'],
      order: [
        [Service.sequelize.fn('COUNT', Service.sequelize.col('appointments.id')), 'DESC'],
        ['average_rating', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { services: popularServices }
    });

  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get my services (for nakes)
exports.getMyServices = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const nakes_id = req.user.id;
    const offset = (page - 1) * limit;

    const whereClause = { nakes_id };
    if (status) {
      whereClause.status = status;
    }

    const services = await Service.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointments',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            Service.sequelize.fn('COUNT', Service.sequelize.col('appointments.id')),
            'total_appointments'
          ]
        ]
      },
      group: ['Service.id'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        services: services.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(services.count.length / limit),
          total_items: services.count.length,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};