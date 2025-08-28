const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nakes_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Service Information
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'konsultasi', 'perawatan_luka', 'fisioterapi', 
        'konsultasi_gizi', 'laktasi', 'perawatan_lansia',
        'perawatan_anak', 'rehabilitasi', 'promosi_kesehatan',
        'kesehatan_lingkungan', 'farmasi_klinis', 'radiologi',
        'laboratorium', 'terapi_wicara', 'okupasi_terapi'
      ),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Pricing
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'IDR'
    },
    
    // Service Details
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 15,
        max: 480 // 8 hours max
      }
    },
    service_type: {
      type: DataTypes.ENUM('home_visit', 'teleconsultation', 'clinic_visit', 'hybrid'),
      allowNull: false,
      defaultValue: 'home_visit'
    },
    
    // Availability
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    max_distance_km: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 100
      },
      comment: 'Maximum distance for home visits in kilometers'
    },
    
    // Requirements and Preparations
    requirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Patient requirements and preparations needed'
    },
    equipment_needed: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Equipment that will be brought by Nakes'
    },
    
    // SOP and Guidelines
    sop_checklist: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Standard Operating Procedure checklist'
    },
    contraindications: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Medical contraindications for this service'
    },
    
    // Booking Settings
    advance_booking_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      validate: {
        min: 1,
        max: 168 // 1 week max
      },
      comment: 'Minimum hours in advance for booking'
    },
    cancellation_policy_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      validate: {
        min: 1,
        max: 72
      },
      comment: 'Hours before appointment for free cancellation'
    },
    
    // Statistics
    total_bookings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completed_bookings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Media
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of image URLs'
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    
    // Tags and Keywords
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of searchable tags'
    },
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Searchable keywords for this service'
    },
    
    // Certification Requirements
    required_certifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Required certifications for this service'
    },
    
    // Emergency Protocols
    emergency_protocols: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Emergency procedures and contact information'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'services',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        fields: ['nakes_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['service_type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['base_price']
      },
      {
        fields: ['average_rating']
      },
      {
        fields: ['category', 'subcategory']
      },
      {
        fields: ['service_type', 'is_active']
      }
    ]
  });
  
  // Instance methods
  Service.prototype.calculateTotalPrice = function(platformFeePercentage = 7) {
    const platformFee = (this.base_price * platformFeePercentage) / 100;
    return {
      basePrice: parseFloat(this.base_price),
      platformFee: parseFloat(platformFee.toFixed(2)),
      totalPrice: parseFloat((this.base_price + platformFee).toFixed(2))
    };
  };
  
  Service.prototype.isAvailableForBooking = function() {
    return this.is_active && this.nakes && this.nakes.status === 'active' && this.nakes.is_available;
  };
  
  Service.prototype.updateRating = async function(newRating) {
    const totalRating = (this.average_rating * this.total_reviews) + newRating;
    const newTotalReviews = this.total_reviews + 1;
    const newAverageRating = totalRating / newTotalReviews;
    
    return this.update({
      average_rating: parseFloat(newAverageRating.toFixed(2)),
      total_reviews: newTotalReviews
    });
  };
  
  Service.prototype.incrementBooking = async function() {
    return this.update({
      total_bookings: this.total_bookings + 1
    });
  };
  
  Service.prototype.incrementCompletedBooking = async function() {
    return this.update({
      completed_bookings: this.completed_bookings + 1
    });
  };
  
  // Class methods
  Service.findByCategory = function(category, options = {}) {
    return this.findAll({
      where: {
        category,
        is_active: true,
        ...options.where
      },
      include: [{
        model: sequelize.models.User,
        as: 'nakes',
        where: {
          status: 'active',
          documents_verified: true
        },
        attributes: ['id', 'full_name', 'profession', 'average_rating', 'total_reviews']
      }],
      ...options
    });
  };
  
  Service.findNearby = function(latitude, longitude, radiusKm = 10, options = {}) {
    const earthRadiusKm = 6371;
    
    return this.findAll({
      where: {
        is_active: true,
        ...options.where
      },
      include: [{
        model: sequelize.models.User,
        as: 'nakes',
        where: {
          status: 'active',
          documents_verified: true,
          latitude: { [sequelize.Sequelize.Op.ne]: null },
          longitude: { [sequelize.Sequelize.Op.ne]: null }
        },
        attributes: {
          include: [
            [
              sequelize.literal(`(
                ${earthRadiusKm} * acos(
                  cos(radians(${latitude})) *
                  cos(radians(latitude)) *
                  cos(radians(longitude) - radians(${longitude})) +
                  sin(radians(${latitude})) *
                  sin(radians(latitude))
                )
              )`),
              'distance'
            ]
          ]
        }
      }],
      having: sequelize.literal(`distance <= ${radiusKm}`),
      order: [[sequelize.literal('distance'), 'ASC']],
      ...options
    });
  };
  
  Service.searchServices = function(searchTerm, options = {}) {
    const { Op } = sequelize.Sequelize;
    
    return this.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
          { keywords: { [Op.iLike]: `%${searchTerm}%` } },
          { tags: { [Op.contains]: [searchTerm] } }
        ],
        ...options.where
      },
      include: [{
        model: sequelize.models.User,
        as: 'nakes',
        where: {
          status: 'active',
          documents_verified: true
        }
      }],
      ...options
    });
  };
  
  return Service;
};