const { Review, User, Service, Appointment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { sendNotification } = require('../services/notificationService');
const { analyzeSentiment } = require('../services/sentimentAnalysisService');

// Configure multer for review image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/reviews');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 images per review
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create review
exports.createReview = [upload.array('images', 5), async (req, res) => {
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
      nakes_id,
      service_id,
      overall_rating,
      service_quality_rating,
      communication_rating,
      punctuality_rating,
      professionalism_rating,
      cleanliness_rating,
      value_rating,
      title,
      comment,
      pros,
      cons,
      tags,
      is_anonymous = false
    } = req.body;

    const patient_id = req.user.id;

    // Verify appointment exists and belongs to patient
    const appointment = await Appointment.findOne({
      where: {
        id: appointment_id,
        patient_id,
        status: 'completed'
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Completed appointment not found'
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({
      where: { appointment_id }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this appointment'
      });
    }

    // Verify Nakes and service
    const [nakes, service] = await Promise.all([
      User.findOne({ where: { id: nakes_id, role: 'nakes' } }),
      Service.findByPk(service_id)
    ]);

    if (!nakes) {
      return res.status(404).json({
        success: false,
        message: 'Healthcare provider not found'
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Process uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        filename: file.filename,
        original_name: file.originalname,
        size: file.size
      }));
    }

    // Analyze sentiment of the comment
    let sentiment = null;
    if (comment) {
      try {
        sentiment = await analyzeSentiment(comment);
      } catch (sentimentError) {
        console.error('Sentiment analysis error:', sentimentError);
      }
    }

    // Create review
    const review = await Review.create({
      appointment_id,
      patient_id,
      nakes_id,
      service_id,
      overall_rating: parseFloat(overall_rating),
      service_quality_rating: service_quality_rating ? parseFloat(service_quality_rating) : null,
      communication_rating: communication_rating ? parseFloat(communication_rating) : null,
      punctuality_rating: punctuality_rating ? parseFloat(punctuality_rating) : null,
      professionalism_rating: professionalism_rating ? parseFloat(professionalism_rating) : null,
      cleanliness_rating: cleanliness_rating ? parseFloat(cleanliness_rating) : null,
      value_rating: value_rating ? parseFloat(value_rating) : null,
      title,
      comment,
      pros: pros ? (Array.isArray(pros) ? pros : [pros]) : [],
      cons: cons ? (Array.isArray(cons) ? cons : [cons]) : [],
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      images: imageUrls,
      is_anonymous,
      sentiment,
      status: 'pending',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      device_info: req.body.device_info || null,
      location: req.body.location || null
    });

    // Send notification to Nakes
    await sendNotification({
      user_id: nakes_id,
      type: 'new_review',
      title: 'New Review Received',
      message: `You received a new ${overall_rating}-star review`,
      data: {
        review_id: review.id,
        rating: overall_rating,
        patient_name: is_anonymous ? 'Anonymous' : req.user.full_name
      }
    });

    // Load created review with associations
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'avatar_url']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: createdReview }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}];

// Get reviews
exports.getReviews = async (req, res) => {
  try {
    const {
      nakes_id,
      service_id,
      patient_id,
      rating_min,
      rating_max,
      status = 'approved',
      featured_only = false,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = { status };

    if (nakes_id) {
      whereClause.nakes_id = nakes_id;
    }

    if (service_id) {
      whereClause.service_id = service_id;
    }

    if (patient_id) {
      whereClause.patient_id = patient_id;
    }

    if (rating_min) {
      whereClause.overall_rating = {
        [Op.gte]: parseFloat(rating_min)
      };
    }

    if (rating_max) {
      whereClause.overall_rating = {
        ...whereClause.overall_rating,
        [Op.lte]: parseFloat(rating_max)
      };
    }

    if (featured_only === 'true') {
      whereClause.is_featured = true;
    }

    const validSortFields = ['created_at', 'overall_rating', 'helpful_count'];
    const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const reviews = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'avatar_url']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date']
        }
      ],
      order: [[orderField, orderDirection]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Hide patient info for anonymous reviews
    const processedReviews = reviews.rows.map(review => {
      const reviewData = review.toJSON();
      if (reviewData.is_anonymous) {
        reviewData.patient = {
          id: null,
          full_name: 'Anonymous',
          avatar_url: null
        };
      }
      return reviewData;
    });

    res.json({
      success: true,
      data: {
        reviews: processedReviews,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(reviews.count / limit),
          total_items: reviews.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single review
exports.getReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'avatar_url']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category', 'description']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointment_date']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Hide patient info for anonymous reviews
    const reviewData = review.toJSON();
    if (reviewData.is_anonymous) {
      reviewData.patient = {
        id: null,
        full_name: 'Anonymous',
        avatar_url: null
      };
    }

    res.json({
      success: true,
      data: { review: reviewData }
    });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update review (patient only)
exports.updateReview = async (req, res) => {
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
      overall_rating,
      service_quality_rating,
      communication_rating,
      punctuality_rating,
      professionalism_rating,
      cleanliness_rating,
      value_rating,
      title,
      comment,
      pros,
      cons,
      tags
    } = req.body;

    const patient_id = req.user.id;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        patient_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Check if review can be edited
    if (!review.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Review cannot be edited (too old or already moderated)'
      });
    }

    // Analyze sentiment if comment changed
    let sentiment = review.sentiment;
    if (comment && comment !== review.comment) {
      try {
        sentiment = await analyzeSentiment(comment);
      } catch (sentimentError) {
        console.error('Sentiment analysis error:', sentimentError);
      }
    }

    // Update review
    const updateData = {
      updated_at: new Date()
    };

    if (overall_rating !== undefined) updateData.overall_rating = parseFloat(overall_rating);
    if (service_quality_rating !== undefined) updateData.service_quality_rating = service_quality_rating ? parseFloat(service_quality_rating) : null;
    if (communication_rating !== undefined) updateData.communication_rating = communication_rating ? parseFloat(communication_rating) : null;
    if (punctuality_rating !== undefined) updateData.punctuality_rating = punctuality_rating ? parseFloat(punctuality_rating) : null;
    if (professionalism_rating !== undefined) updateData.professionalism_rating = professionalism_rating ? parseFloat(professionalism_rating) : null;
    if (cleanliness_rating !== undefined) updateData.cleanliness_rating = cleanliness_rating ? parseFloat(cleanliness_rating) : null;
    if (value_rating !== undefined) updateData.value_rating = value_rating ? parseFloat(value_rating) : null;
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;
    if (pros !== undefined) updateData.pros = Array.isArray(pros) ? pros : [pros];
    if (cons !== undefined) updateData.cons = Array.isArray(cons) ? cons : [cons];
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];
    if (sentiment) updateData.sentiment = sentiment;

    // Add to edit history
    const editHistory = review.edit_history || [];
    editHistory.push({
      edited_at: new Date(),
      edited_by: patient_id,
      changes: Object.keys(updateData)
    });
    updateData.edit_history = editHistory;

    await review.update(updateData);

    // Load updated review
    const updatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'full_name', 'avatar_url']
        },
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete review (patient only)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const patient_id = req.user.id;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        patient_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Check if review can be deleted
    if (!review.canDelete()) {
      return res.status(400).json({
        success: false,
        message: 'Review cannot be deleted (too old or already moderated)'
      });
    }

    // Soft delete
    await review.update({
      status: 'deleted',
      deleted_at: new Date()
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark review as helpful
exports.markAsHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true for helpful, false for not helpful
    const user_id = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (helpful) {
      await review.markAsHelpful(user_id);
    } else {
      await review.markAsNotHelpful(user_id);
    }

    // Get updated counts
    const updatedReview = await Review.findByPk(id);
    const helpfulnessRatio = updatedReview.getHelpfulnessRatio();

    res.json({
      success: true,
      message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
      data: {
        helpful_count: updatedReview.helpful_count,
        not_helpful_count: updatedReview.not_helpful_count,
        helpfulness_ratio: helpfulnessRatio
      }
    });

  } catch (error) {
    console.error('Mark as helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add Nakes response
exports.addNakesResponse = async (req, res) => {
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
    const { response } = req.body;
    const nakes_id = req.user.id;

    // Find review
    const review = await Review.findOne({
      where: {
        id,
        nakes_id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Add response
    await review.addNakesResponse(response, nakes_id);

    // Send notification to patient
    await sendNotification({
      user_id: review.patient_id,
      type: 'review_response',
      title: 'Response to Your Review',
      message: 'The healthcare provider has responded to your review',
      data: {
        review_id: review.id,
        nakes_name: req.user.full_name
      }
    });

    // Load updated review
    const updatedReview = await Review.findByPk(id, {
      include: [
        {
          model: User,
          as: 'nakes',
          attributes: ['id', 'full_name', 'specialization']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { review: updatedReview }
    });

  } catch (error) {
    console.error('Add Nakes response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Moderate review (admin only)
exports.moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'hide', 'flag'
    const moderator_id = req.user.id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    let newStatus;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'hide':
        newStatus = 'hidden';
        break;
      case 'flag':
        newStatus = 'flagged';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid moderation action'
        });
    }

    // Update review
    await review.update({
      status: newStatus,
      moderation_reason: reason,
      moderated_by: moderator_id,
      moderated_at: new Date()
    });

    // Send notification to patient
    await sendNotification({
      user_id: review.patient_id,
      type: 'review_moderated',
      title: 'Review Status Updated',
      message: `Your review has been ${action}d`,
      data: {
        review_id: review.id,
        action,
        reason
      }
    });

    res.json({
      success: true,
      message: `Review ${action}d successfully`
    });

  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const {
      nakes_id,
      service_id,
      start_date,
      end_date
    } = req.query;

    let whereClause = { status: 'approved' };

    if (nakes_id) {
      whereClause.nakes_id = nakes_id;
    }

    if (service_id) {
      whereClause.service_id = service_id;
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const [averageRatings, ratingDistribution, totalReviews] = await Promise.all([
      Review.getAverageRatings(whereClause),
      Review.getRatingDistribution(whereClause),
      Review.count({ where: whereClause })
    ]);

    const stats = {
      total_reviews: totalReviews,
      average_ratings: averageRatings,
      rating_distribution: ratingDistribution
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search reviews
exports.searchReviews = async (req, res) => {
  try {
    const {
      query,
      nakes_id,
      service_id,
      rating_min,
      rating_max,
      page = 1,
      limit = 20
    } = req.query;

    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long'
      });
    }

    const offset = (page - 1) * limit;

    let whereClause = {
      status: 'approved',
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { comment: { [Op.iLike]: `%${query}%` } },
        { pros: { [Op.contains]: [query] } },
        { cons: { [Op.contains]: [query] } },
        { tags: { [Op.contains]: [query] } }
      ]
    };

    if (nakes_id) {
      whereClause.nakes_id = nakes_id;
    }

    if (service_id) {
      whereClause.service_id = service_id;
    }

    if (rating_min) {
      whereClause.overall_rating = {
        [Op.gte]: parseFloat(rating_min)
      };
    }

    if (rating_max) {
      whereClause.overall_rating = {
        ...whereClause.overall_rating,
        [Op.lte]: parseFloat(rating_max)
      };
    }

    const reviews = await Review.searchReviews(query, whereClause, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reviews: reviews.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(reviews.count / limit),
          total_items: reviews.count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get featured reviews
exports.getFeaturedReviews = async (req, res) => {
  try {
    const {
      nakes_id,
      service_id,
      limit = 10
    } = req.query;

    let whereClause = {
      status: 'approved',
      is_featured: true
    };

    if (nakes_id) {
      whereClause.nakes_id = nakes_id;
    }

    if (service_id) {
      whereClause.service_id = service_id;
    }

    const reviews = await Review.findFeaturedReviews(whereClause, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { reviews }
    });

  } catch (error) {
    console.error('Get featured reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};