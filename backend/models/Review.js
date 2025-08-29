const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  appointment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  nakes_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Services',
      key: 'id'
    }
  },
  overall_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  service_quality_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  communication_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  punctuality_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  professionalism_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  cleanliness_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  value_for_money_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pros: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  cons: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true // URLs to review images
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'hidden', 'flagged'),
    defaultValue: 'pending'
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  helpful_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  not_helpful_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  report_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  response_from_nakes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moderated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  moderated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moderation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sentiment_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true // AI-generated sentiment score (-1 to 1)
  },
  sentiment_label: {
    type: DataTypes.ENUM('positive', 'neutral', 'negative'),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'id'
  },
  source: {
    type: DataTypes.ENUM('app', 'web', 'sms', 'email', 'phone'),
    defaultValue: 'app'
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  device_info: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  edit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  original_review: {
    type: DataTypes.JSONB,
    allowNull: true // Store original review data if edited
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['appointment_id'],
      unique: true // One review per appointment
    },
    {
      fields: ['patient_id']
    },
    {
      fields: ['nakes_id']
    },
    {
      fields: ['service_id']
    },
    {
      fields: ['overall_rating']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_verified']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['sentiment_label']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['helpful_count']
    },
    {
      fields: ['report_count']
    },
    {
      using: 'gin',
      fields: ['tags']
    },
    {
      using: 'gin',
      fields: ['pros']
    },
    {
      using: 'gin',
      fields: ['cons']
    }
  ]
});

// Instance methods
Review.prototype.approve = function(moderatorId = null, reason = null) {
  this.status = 'approved';
  this.is_verified = true;
  this.moderated_by = moderatorId;
  this.moderated_at = new Date();
  this.moderation_reason = reason;
  
  return this.save();
};

Review.prototype.reject = function(moderatorId, reason) {
  this.status = 'rejected';
  this.moderated_by = moderatorId;
  this.moderated_at = new Date();
  this.moderation_reason = reason;
  
  return this.save();
};

Review.prototype.hide = function(moderatorId, reason) {
  this.status = 'hidden';
  this.moderated_by = moderatorId;
  this.moderated_at = new Date();
  this.moderation_reason = reason;
  
  return this.save();
};

Review.prototype.flag = function(reason) {
  this.status = 'flagged';
  this.report_count += 1;
  
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.flags) {
    this.metadata.flags = [];
  }
  
  this.metadata.flags.push({
    reason: reason,
    flagged_at: new Date()
  });
  
  return this.save();
};

Review.prototype.markHelpful = function(userId) {
  this.helpful_count += 1;
  
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.helpful_users) {
    this.metadata.helpful_users = [];
  }
  
  if (!this.metadata.helpful_users.includes(userId)) {
    this.metadata.helpful_users.push(userId);
  }
  
  return this.save();
};

Review.prototype.markNotHelpful = function(userId) {
  this.not_helpful_count += 1;
  
  if (!this.metadata) {
    this.metadata = {};
  }
  
  if (!this.metadata.not_helpful_users) {
    this.metadata.not_helpful_users = [];
  }
  
  if (!this.metadata.not_helpful_users.includes(userId)) {
    this.metadata.not_helpful_users.push(userId);
  }
  
  return this.save();
};

Review.prototype.addNakesResponse = function(response) {
  this.response_from_nakes = response;
  this.response_at = new Date();
  
  return this.save();
};

Review.prototype.editReview = function(updates) {
  // Store original review if this is the first edit
  if (this.edit_count === 0) {
    this.original_review = {
      title: this.title,
      comment: this.comment,
      overall_rating: this.overall_rating,
      service_quality_rating: this.service_quality_rating,
      communication_rating: this.communication_rating,
      punctuality_rating: this.punctuality_rating,
      professionalism_rating: this.professionalism_rating,
      cleanliness_rating: this.cleanliness_rating,
      value_for_money_rating: this.value_for_money_rating,
      pros: this.pros,
      cons: this.cons,
      tags: this.tags
    };
  }
  
  // Update fields
  Object.keys(updates).forEach(key => {
    if (this[key] !== undefined) {
      this[key] = updates[key];
    }
  });
  
  this.edited_at = new Date();
  this.edit_count += 1;
  
  // Reset moderation status if content changed
  if (updates.comment || updates.title) {
    this.status = 'pending';
    this.moderated_by = null;
    this.moderated_at = null;
    this.moderation_reason = null;
  }
  
  return this.save();
};

Review.prototype.calculateAverageRating = function() {
  const ratings = [
    this.service_quality_rating,
    this.communication_rating,
    this.punctuality_rating,
    this.professionalism_rating,
    this.cleanliness_rating,
    this.value_for_money_rating
  ].filter(rating => rating !== null);
  
  if (ratings.length === 0) {
    return this.overall_rating;
  }
  
  const sum = ratings.reduce((acc, rating) => acc + parseFloat(rating), 0);
  return (sum / ratings.length).toFixed(1);
};

Review.prototype.setSentiment = function(score, label) {
  this.sentiment_score = score;
  this.sentiment_label = label;
  
  return this.save();
};

Review.prototype.isEditable = function() {
  // Can edit within 24 hours and max 3 edits
  const hoursSinceCreation = (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24 && this.edit_count < 3;
};

Review.prototype.canBeDeleted = function() {
  // Can delete within 1 hour of creation
  const hoursSinceCreation = (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreation <= 1;
};

Review.prototype.getHelpfulnessRatio = function() {
  const total = this.helpful_count + this.not_helpful_count;
  return total > 0 ? (this.helpful_count / total) : 0;
};

// Class methods
Review.findByNakes = function(nakesId, options = {}) {
  const { status = 'approved', limit = 50, offset = 0, orderBy = 'createdAt', order = 'DESC' } = options;
  
  return this.findAll({
    where: {
      nakes_id: nakesId,
      status: status
    },
    order: [[orderBy, order]],
    limit,
    offset
  });
};

Review.findByPatient = function(patientId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  return this.findAll({
    where: {
      patient_id: patientId
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Review.findByService = function(serviceId, options = {}) {
  const { status = 'approved', limit = 50, offset = 0 } = options;
  
  return this.findAll({
    where: {
      service_id: serviceId,
      status: status
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Review.findFeatured = function(limit = 10) {
  return this.findAll({
    where: {
      is_featured: true,
      status: 'approved'
    },
    order: [['helpful_count', 'DESC'], ['createdAt', 'DESC']],
    limit
  });
};

Review.findPendingModeration = function() {
  return this.findAll({
    where: {
      status: ['pending', 'flagged']
    },
    order: [['report_count', 'DESC'], ['createdAt', 'ASC']]
  });
};

Review.getAverageRating = function(nakesId, serviceId = null) {
  const whereClause = {
    nakes_id: nakesId,
    status: 'approved'
  };
  
  if (serviceId) {
    whereClause.service_id = serviceId;
  }
  
  return this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('AVG', sequelize.col('overall_rating')), 'average_rating'],
      [sequelize.fn('AVG', sequelize.col('service_quality_rating')), 'avg_service_quality'],
      [sequelize.fn('AVG', sequelize.col('communication_rating')), 'avg_communication'],
      [sequelize.fn('AVG', sequelize.col('punctuality_rating')), 'avg_punctuality'],
      [sequelize.fn('AVG', sequelize.col('professionalism_rating')), 'avg_professionalism'],
      [sequelize.fn('AVG', sequelize.col('cleanliness_rating')), 'avg_cleanliness'],
      [sequelize.fn('AVG', sequelize.col('value_for_money_rating')), 'avg_value_for_money'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews']
    ]
  });
};

Review.getRatingDistribution = function(nakesId, serviceId = null) {
  const whereClause = {
    nakes_id: nakesId,
    status: 'approved'
  };
  
  if (serviceId) {
    whereClause.service_id = serviceId;
  }
  
  return this.findAll({
    where: whereClause,
    attributes: [
      'overall_rating',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['overall_rating'],
    order: [['overall_rating', 'DESC']]
  });
};

Review.getReviewStats = function(nakesId, startDate, endDate) {
  return this.findAll({
    where: {
      nakes_id: nakesId,
      createdAt: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews'],
      [sequelize.fn('AVG', sequelize.col('overall_rating')), 'average_rating'],
      'sentiment_label',
      [sequelize.fn('COUNT', sequelize.col('sentiment_label')), 'sentiment_count']
    ],
    group: [sequelize.fn('DATE', sequelize.col('createdAt')), 'sentiment_label']
  });
};

Review.searchReviews = function(query, options = {}) {
  const { nakesId = null, serviceId = null, rating = null, sentiment = null, limit = 50, offset = 0 } = options;
  
  const whereClause = {
    status: 'approved',
    [sequelize.Sequelize.Op.or]: [
      {
        title: {
          [sequelize.Sequelize.Op.iLike]: `%${query}%`
        }
      },
      {
        comment: {
          [sequelize.Sequelize.Op.iLike]: `%${query}%`
        }
      }
    ]
  };
  
  if (nakesId) {
    whereClause.nakes_id = nakesId;
  }
  
  if (serviceId) {
    whereClause.service_id = serviceId;
  }
  
  if (rating) {
    whereClause.overall_rating = {
      [sequelize.Sequelize.Op.gte]: rating
    };
  }
  
  if (sentiment) {
    whereClause.sentiment_label = sentiment;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['helpful_count', 'DESC'], ['createdAt', 'DESC']],
    limit,
    offset
  });
};

module.exports = Review;