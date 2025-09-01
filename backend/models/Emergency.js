const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Emergency details
  type: {
    type: String,
    enum: ['medical', 'accident', 'fire', 'crime', 'natural_disaster', 'other'],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: {
      type: String
    }
  },
  
  // Contact information
  contactNumber: {
    type: String,
    required: true
  },
  
  alternateContact: {
    type: String
  },
  
  // Medical information (if applicable)
  medicalInfo: {
    patientAge: Number,
    patientGender: {
      type: String,
      enum: ['male', 'female']
    },
    symptoms: String,
    allergies: String,
    medications: String,
    medicalHistory: String,
    consciousness: {
      type: String,
      enum: ['conscious', 'unconscious', 'semi_conscious']
    },
    breathing: {
      type: String,
      enum: ['normal', 'difficulty', 'not_breathing']
    },
    pulse: {
      type: String,
      enum: ['normal', 'weak', 'strong', 'irregular', 'no_pulse']
    }
  },
  
  // Emergency response
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'en_route', 'on_scene', 'resolved', 'cancelled'],
    default: 'pending'
  },
  
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // PSC 119 integration
  psc119: {
    ticketId: String,
    dispatchTime: Date,
    estimatedArrival: Date,
    actualArrival: Date,
    unitAssigned: String,
    responderInfo: {
      name: String,
      contact: String,
      vehicleNumber: String
    }
  },
  
  // Nearby healthcare providers
  nearbyProviders: [{
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    distance: Number, // in kilometers
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date,
    responded: {
      type: Boolean,
      default: false
    },
    respondedAt: Date,
    response: {
      type: String,
      enum: ['available', 'unavailable', 'en_route']
    }
  }],
  
  // Timeline and updates
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event: {
      type: String,
      required: true
    },
    description: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution
  resolvedAt: Date,
  resolution: {
    outcome: {
      type: String,
      enum: ['transported', 'treated_on_scene', 'refused_treatment', 'false_alarm', 'cancelled']
    },
    hospitalTransported: String,
    notes: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ userId: 1, createdAt: -1 });
emergencySchema.index({ status: 1, priority: -1 });
emergencySchema.index({ 'psc119.ticketId': 1 });
emergencySchema.index({ createdAt: -1 });

// Virtual for calculating response time
emergencySchema.virtual('responseTime').get(function() {
  if (this.psc119.dispatchTime) {
    return this.psc119.dispatchTime - this.createdAt;
  }
  return null;
});

// Virtual for calculating total resolution time
emergencySchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt) {
    return this.resolvedAt - this.createdAt;
  }
  return null;
});

// Pre-save middleware
emergencySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Add timeline entry for status changes
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      event: 'status_change',
      description: `Status changed to ${this.status}`,
      timestamp: new Date()
    });
  }
  
  next();
});

// Static methods
emergencySchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ['pending', 'dispatched', 'en_route', 'on_scene'] }
  });
};

emergencySchema.statics.getActiveEmergencies = function() {
  return this.find({
    status: { $in: ['pending', 'dispatched', 'en_route', 'on_scene'] },
    isActive: true
  }).sort({ priority: -1, createdAt: 1 });
};

emergencySchema.statics.getEmergencyStats = function(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEmergencies: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        avgResolutionTime: { $avg: '$resolutionTime' },
        byType: {
          $push: {
            type: '$type',
            severity: '$severity',
            status: '$status'
          }
        }
      }
    }
  ]);
};

// Instance methods
emergencySchema.methods.addTimelineEvent = function(event, description, updatedBy) {
  this.timeline.push({
    event,
    description,
    updatedBy,
    timestamp: new Date()
  });
  return this.save();
};

emergencySchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.status = newStatus;
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
  }
  
  return this.addTimelineEvent('status_update', notes || `Status updated to ${newStatus}`, updatedBy);
};

emergencySchema.methods.assignPSC119 = function(ticketId, unitAssigned, estimatedArrival) {
  this.psc119.ticketId = ticketId;
  this.psc119.dispatchTime = new Date();
  this.psc119.unitAssigned = unitAssigned;
  this.psc119.estimatedArrival = estimatedArrival;
  this.status = 'dispatched';
  
  return this.addTimelineEvent('psc119_assigned', `PSC 119 unit ${unitAssigned} assigned with ticket ${ticketId}`);
};

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;