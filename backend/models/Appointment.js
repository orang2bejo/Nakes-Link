const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
    allowNull: false,
    references: {
      model: 'Services',
      key: 'id'
    }
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('online', 'home_visit', 'clinic'),
    allowNull: false
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true // Required for home_visit and clinic types
  },
  coordinates: {
    type: DataTypes.JSONB,
    allowNull: true // {lat: number, lng: number}
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_level: {
    type: DataTypes.ENUM('normal', 'urgent', 'emergency'),
    defaultValue: 'normal'
  },
  estimated_duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  actual_start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prescription: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  follow_up_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  chat_room_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
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
      fields: ['appointment_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['emergency_level']
    },
    {
      fields: ['payment_status']
    }
  ]
});

// Instance methods
Appointment.prototype.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(`${this.appointment_date} ${this.appointment_time}`);
  const timeDiff = appointmentDateTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return ['pending', 'confirmed'].includes(this.status) && hoursDiff > 2;
};

Appointment.prototype.canBeRescheduled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(`${this.appointment_date} ${this.appointment_time}`);
  const timeDiff = appointmentDateTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return ['pending', 'confirmed'].includes(this.status) && hoursDiff > 4;
};

Appointment.prototype.isUpcoming = function() {
  const now = new Date();
  const appointmentDateTime = new Date(`${this.appointment_date} ${this.appointment_time}`);
  return appointmentDateTime > now && ['pending', 'confirmed'].includes(this.status);
};

Appointment.prototype.calculateTotalAmount = function() {
  const platformFeeAmount = (this.price * parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || 7)) / 100;
  this.platform_fee = platformFeeAmount;
  this.total_amount = parseFloat(this.price) + platformFeeAmount;
  return this.total_amount;
};

// Class methods
Appointment.findUpcoming = function(userId, role) {
  const whereClause = role === 'patient' ? { patient_id: userId } : { nakes_id: userId };
  const now = new Date();
  
  return this.findAll({
    where: {
      ...whereClause,
      appointment_date: {
        [sequelize.Sequelize.Op.gte]: now
      },
      status: {
        [sequelize.Sequelize.Op.in]: ['pending', 'confirmed']
      }
    },
    order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
  });
};

Appointment.findByDateRange = function(startDate, endDate, nakesId = null) {
  const whereClause = {
    appointment_date: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    }
  };
  
  if (nakesId) {
    whereClause.nakes_id = nakesId;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
  });
};

module.exports = Appointment;