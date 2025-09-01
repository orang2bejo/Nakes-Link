const Emergency = require('../models/Emergency');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { integrateWithPSC119 } = require('../services/psc119Service');
const { calculateDistance } = require('../utils/geoUtils');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create new emergency request
 */
const createEmergency = async (req, res) => {
  const {
    type,
    severity,
    description,
    location,
    contactNumber,
    alternateContact,
    medicalInfo
  } = req.body;

  // Validate required fields
  if (!type || !description || !location || !contactNumber) {
    throw new AppError('Missing required fields', 400);
  }

  // Validate location coordinates
  if (!location.coordinates || location.coordinates.length !== 2) {
    throw new AppError('Invalid location coordinates', 400);
  }

  // Create emergency record
  const emergency = new Emergency({
    userId: req.user.id,
    type,
    severity: severity || 'medium',
    description,
    location,
    contactNumber,
    alternateContact,
    medicalInfo,
    timeline: [{
      event: 'emergency_created',
      description: 'Emergency request created',
      updatedBy: req.user.id
    }]
  });

  // Set priority based on severity and type
  emergency.priority = calculatePriority(type, severity, medicalInfo);

  await emergency.save();

  // Find nearby healthcare providers
  const nearbyProviders = await findNearbyProviders(
    location.coordinates[0],
    location.coordinates[1],
    10 // 10km radius
  );

  // Update emergency with nearby providers
  emergency.nearbyProviders = nearbyProviders.map(provider => ({
    providerId: provider._id,
    distance: provider.distance
  }));

  await emergency.save();

  // Integrate with PSC 119 for high priority emergencies
  if (emergency.priority >= 4 || emergency.severity === 'critical') {
    try {
      const psc119Response = await integrateWithPSC119(emergency);
      if (psc119Response.success) {
        emergency.psc119.ticketId = psc119Response.ticketId;
        emergency.psc119.dispatchTime = new Date();
        emergency.psc119.estimatedArrival = psc119Response.estimatedArrival;
        emergency.status = 'dispatched';
        await emergency.save();
      }
    } catch (error) {
      console.error('PSC 119 integration failed:', error);
      // Continue without PSC 119 integration
    }
  }

  // Notify nearby healthcare providers
  await notifyNearbyProviders(emergency, nearbyProviders);

  // Send confirmation to user
  await sendNotification({
    userId: req.user.id,
    type: 'emergency_created',
    title: 'Emergency Request Created',
    message: `Your emergency request has been created. Emergency ID: ${emergency._id}`,
    data: { emergencyId: emergency._id }
  });

  res.status(201).json({
    success: true,
    message: 'Emergency request created successfully',
    data: {
      emergency: {
        id: emergency._id,
        type: emergency.type,
        severity: emergency.severity,
        status: emergency.status,
        priority: emergency.priority,
        location: emergency.location,
        psc119TicketId: emergency.psc119.ticketId,
        estimatedArrival: emergency.psc119.estimatedArrival,
        nearbyProvidersCount: nearbyProviders.length
      }
    }
  });
};

/**
 * Get emergency details
 */
const getEmergency = async (req, res) => {
  const { id } = req.params;
  
  const emergency = await Emergency.findById(id)
    .populate('userId', 'name email phone')
    .populate('nearbyProviders.providerId', 'name phone specialization location')
    .populate('timeline.updatedBy', 'name');

  if (!emergency) {
    throw new AppError('Emergency not found', 404);
  }

  // Check if user has permission to view this emergency
  const canView = 
    emergency.userId._id.toString() === req.user.id ||
    req.user.role === 'admin' ||
    (req.user.role === 'nakes' && emergency.nearbyProviders.some(
      provider => provider.providerId._id.toString() === req.user.id
    ));

  if (!canView) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: { emergency }
  });
};

/**
 * Get user's emergency history
 */
const getUserEmergencies = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { userId: req.user.id };
  if (status) {
    query.status = status;
  }

  const emergencies = await Emergency.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-timeline -nearbyProviders');

  const total = await Emergency.countDocuments(query);

  res.json({
    success: true,
    data: {
      emergencies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
};

/**
 * Get active emergencies (for healthcare providers)
 */
const getActiveEmergencies = async (req, res) => {
  if (req.user.role !== 'nakes' && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { latitude, longitude, radius = 10 } = req.query;
  
  let emergencies;
  
  if (latitude && longitude) {
    // Find emergencies near the provider
    emergencies = await Emergency.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      radius * 1000 // Convert km to meters
    ).populate('userId', 'name phone');
  } else {
    // Get all active emergencies (for admin)
    emergencies = await Emergency.getActiveEmergencies()
      .populate('userId', 'name phone');
  }

  res.json({
    success: true,
    data: { emergencies }
  });
};

/**
 * Respond to emergency (for healthcare providers)
 */
const respondToEmergency = async (req, res) => {
  if (req.user.role !== 'nakes') {
    throw new AppError('Only healthcare providers can respond to emergencies', 403);
  }

  const { id } = req.params;
  const { response, estimatedArrival } = req.body;

  const emergency = await Emergency.findById(id);
  if (!emergency) {
    throw new AppError('Emergency not found', 404);
  }

  // Check if provider is in the nearby providers list
  const providerIndex = emergency.nearbyProviders.findIndex(
    provider => provider.providerId.toString() === req.user.id
  );

  if (providerIndex === -1) {
    throw new AppError('You are not authorized to respond to this emergency', 403);
  }

  // Update provider response
  emergency.nearbyProviders[providerIndex].responded = true;
  emergency.nearbyProviders[providerIndex].respondedAt = new Date();
  emergency.nearbyProviders[providerIndex].response = response;

  // Add timeline event
  emergency.timeline.push({
    event: 'provider_response',
    description: `Healthcare provider ${req.user.name} responded: ${response}`,
    updatedBy: req.user.id
  });

  await emergency.save();

  // Notify the emergency requester
  await sendNotification({
    userId: emergency.userId,
    type: 'provider_response',
    title: 'Healthcare Provider Response',
    message: `A healthcare provider has responded to your emergency request`,
    data: {
      emergencyId: emergency._id,
      providerName: req.user.name,
      response,
      estimatedArrival
    }
  });

  res.json({
    success: true,
    message: 'Response recorded successfully'
  });
};

/**
 * Update emergency status
 */
const updateEmergencyStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes, resolution } = req.body;

  const emergency = await Emergency.findById(id);
  if (!emergency) {
    throw new AppError('Emergency not found', 404);
  }

  // Check permissions
  const canUpdate = 
    req.user.role === 'admin' ||
    emergency.userId.toString() === req.user.id ||
    (req.user.role === 'nakes' && emergency.nearbyProviders.some(
      provider => provider.providerId.toString() === req.user.id
    ));

  if (!canUpdate) {
    throw new AppError('Access denied', 403);
  }

  // Update status
  await emergency.updateStatus(status, req.user.id, notes);

  // If resolving, add resolution details
  if (status === 'resolved' && resolution) {
    emergency.resolution = resolution;
    emergency.resolvedAt = new Date();
    await emergency.save();
  }

  // Notify relevant parties
  await sendNotification({
    userId: emergency.userId,
    type: 'emergency_status_update',
    title: 'Emergency Status Updated',
    message: `Your emergency status has been updated to: ${status}`,
    data: {
      emergencyId: emergency._id,
      status,
      notes
    }
  });

  res.json({
    success: true,
    message: 'Emergency status updated successfully',
    data: {
      emergency: {
        id: emergency._id,
        status: emergency.status,
        updatedAt: emergency.updatedAt
      }
    }
  });
};

/**
 * Get emergency statistics (admin only)
 */
const getEmergencyStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate ? new Date(endDate) : new Date();

  const stats = await Emergency.getEmergencyStats(start, end);
  
  // Get current active emergencies
  const activeEmergencies = await Emergency.getActiveEmergencies();
  
  // Get response time statistics
  const responseTimeStats = await Emergency.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        'psc119.dispatchTime': { $exists: true }
      }
    },
    {
      $project: {
        responseTime: {
          $subtract: ['$psc119.dispatchTime', '$createdAt']
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      stats: stats[0] || {},
      activeEmergencies: activeEmergencies.length,
      responseTimeStats: responseTimeStats[0] || {},
      dateRange: { start, end }
    }
  });
};

// Helper functions
const calculatePriority = (type, severity, medicalInfo) => {
  let priority = 3; // Default medium priority
  
  // Adjust based on severity
  switch (severity) {
    case 'critical':
      priority = 5;
      break;
    case 'high':
      priority = 4;
      break;
    case 'medium':
      priority = 3;
      break;
    case 'low':
      priority = 2;
      break;
  }
  
  // Adjust based on type
  if (type === 'medical' && medicalInfo) {
    if (medicalInfo.consciousness === 'unconscious' || medicalInfo.breathing === 'not_breathing') {
      priority = 5;
    } else if (medicalInfo.breathing === 'difficulty' || medicalInfo.pulse === 'no_pulse') {
      priority = Math.max(priority, 4);
    }
  }
  
  return Math.min(priority, 5); // Cap at 5
};

const findNearbyProviders = async (longitude, latitude, radiusKm) => {
  const providers = await User.find({
    role: 'nakes',
    isVerified: true,
    isActive: true,
    'location.coordinates': { $exists: true }
  }).select('name phone specialization location');

  // Calculate distances and filter by radius
  const nearbyProviders = providers
    .map(provider => {
      const distance = calculateDistance(
        latitude,
        longitude,
        provider.location.coordinates[1],
        provider.location.coordinates[0]
      );
      return { ...provider.toObject(), distance };
    })
    .filter(provider => provider.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Limit to 10 nearest providers

  return nearbyProviders;
};

const notifyNearbyProviders = async (emergency, providers) => {
  const notifications = providers.slice(0, 5).map(provider => ({
    userId: provider._id,
    type: 'emergency_alert',
    title: 'Emergency Alert',
    message: `Emergency ${emergency.type} reported nearby. Distance: ${provider.distance.toFixed(1)}km`,
    data: {
      emergencyId: emergency._id,
      emergencyType: emergency.type,
      severity: emergency.severity,
      distance: provider.distance,
      location: emergency.location
    },
    priority: 'high'
  }));

  // Send notifications
  for (const notification of notifications) {
    try {
      await sendNotification(notification);
      
      // Update notification status in emergency record
      const providerIndex = emergency.nearbyProviders.findIndex(
        p => p.providerId.toString() === notification.userId.toString()
      );
      if (providerIndex !== -1) {
        emergency.nearbyProviders[providerIndex].notified = true;
        emergency.nearbyProviders[providerIndex].notifiedAt = new Date();
      }
    } catch (error) {
      console.error(`Failed to notify provider ${notification.userId}:`, error);
    }
  }
  
  await emergency.save();
};

module.exports = {
  createEmergency,
  getEmergency,
  getUserEmergencies,
  getActiveEmergencies,
  respondToEmergency,
  updateEmergencyStatus,
  getEmergencyStats
};