const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
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
  appointment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  record_type: {
    type: DataTypes.ENUM('consultation', 'prescription', 'lab_result', 'imaging', 'vaccination', 'surgery', 'emergency', 'follow_up'),
    allowNull: false
  },
  chief_complaint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  history_of_present_illness: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  past_medical_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  family_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  social_history: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  allergies: {
    type: DataTypes.JSONB,
    allowNull: true // [{name: string, type: string, severity: string, reaction: string}]
  },
  current_medications: {
    type: DataTypes.JSONB,
    allowNull: true // [{name: string, dosage: string, frequency: string, start_date: date}]
  },
  vital_signs: {
    type: DataTypes.JSONB,
    allowNull: true // {blood_pressure: string, heart_rate: number, temperature: number, respiratory_rate: number, oxygen_saturation: number, weight: number, height: number, bmi: number}
  },
  physical_examination: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assessment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.JSONB,
    allowNull: true // [{code: string, description: string, type: 'primary'|'secondary'}]
  },
  treatment_plan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.JSONB,
    allowNull: true // [{medication: string, dosage: string, frequency: string, duration: string, instructions: string}]
  },
  lab_orders: {
    type: DataTypes.JSONB,
    allowNull: true // [{test_name: string, urgency: string, instructions: string}]
  },
  imaging_orders: {
    type: DataTypes.JSONB,
    allowNull: true // [{type: string, body_part: string, urgency: string, instructions: string}]
  },
  referrals: {
    type: DataTypes.JSONB,
    allowNull: true // [{specialist: string, reason: string, urgency: string}]
  },
  follow_up: {
    type: DataTypes.JSONB,
    allowNull: true // {required: boolean, date: date, instructions: string}
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true // [{type: string, url: string, filename: string, description: string}]
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'completed', 'reviewed', 'archived'),
    defaultValue: 'draft'
  },
  privacy_level: {
    type: DataTypes.ENUM('public', 'restricted', 'confidential'),
    defaultValue: 'restricted'
  },
  shared_with: {
    type: DataTypes.JSONB,
    allowNull: true // [user_ids] who can access this record
  },
  satusehat_id: {
    type: DataTypes.STRING,
    allowNull: true // ID from SatuSehat system
  },
  satusehat_synced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  satusehat_sync_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emergency_contact_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  signed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  digital_signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'medical_records',
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
      fields: ['appointment_id']
    },
    {
      fields: ['record_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['privacy_level']
    },
    {
      fields: ['satusehat_id']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
MedicalRecord.prototype.canBeAccessedBy = function(userId, userRole) {
  // Patient can always access their own records
  if (this.patient_id === userId) {
    return true;
  }
  
  // Nakes who created the record can access it
  if (this.nakes_id === userId && userRole === 'nakes') {
    return true;
  }
  
  // Admin can access all records
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if user is in shared_with list
  if (this.shared_with && this.shared_with.includes(userId)) {
    return true;
  }
  
  return false;
};

MedicalRecord.prototype.canBeEditedBy = function(userId, userRole) {
  // Only the creating Nakes can edit within 24 hours of creation
  if (this.nakes_id === userId && userRole === 'nakes') {
    const now = new Date();
    const createdAt = new Date(this.createdAt);
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff <= 24 && this.status === 'draft';
  }
  
  // Admin can always edit
  if (userRole === 'admin') {
    return true;
  }
  
  return false;
};

MedicalRecord.prototype.shareWith = function(userIds) {
  if (!this.shared_with) {
    this.shared_with = [];
  }
  
  const newUserIds = Array.isArray(userIds) ? userIds : [userIds];
  this.shared_with = [...new Set([...this.shared_with, ...newUserIds])];
  
  return this.save();
};

MedicalRecord.prototype.revokeAccess = function(userIds) {
  if (!this.shared_with) {
    return this;
  }
  
  const revokeIds = Array.isArray(userIds) ? userIds : [userIds];
  this.shared_with = this.shared_with.filter(id => !revokeIds.includes(id));
  
  return this.save();
};

MedicalRecord.prototype.signRecord = function(nakesId, digitalSignature) {
  this.signed_by = nakesId;
  this.signed_at = new Date();
  this.digital_signature = digitalSignature;
  this.status = 'completed';
  
  return this.save();
};

// Class methods
MedicalRecord.findByPatient = function(patientId, options = {}) {
  const { limit = 50, offset = 0, recordType = null, startDate = null, endDate = null } = options;
  
  const whereClause = { patient_id: patientId };
  
  if (recordType) {
    whereClause.record_type = recordType;
  }
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

MedicalRecord.findByNakes = function(nakesId, options = {}) {
  const { limit = 50, offset = 0, status = null, startDate = null, endDate = null } = options;
  
  const whereClause = { nakes_id: nakesId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

MedicalRecord.searchRecords = function(patientId, searchTerm) {
  return this.findAll({
    where: {
      patient_id: patientId,
      [sequelize.Sequelize.Op.or]: [
        {
          chief_complaint: {
            [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          assessment: {
            [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          notes: {
            [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = MedicalRecord;