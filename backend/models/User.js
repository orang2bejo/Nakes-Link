const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    role: {
      type: DataTypes.ENUM('patient', 'nakes', 'admin'),
      allowNull: false,
      defaultValue: 'patient'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
      allowNull: false,
      defaultValue: 'pending_verification'
    },
    
    // Basic Information
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true
    },
    profile_picture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Address Information
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    
    // Nakes-specific fields
    nik: {
      type: DataTypes.STRING(16),
      allowNull: true,
      unique: true,
      validate: {
        len: [16, 16]
      }
    },
    str: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Surat Tanda Registrasi Number'
    },
    str_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Surat Tanda Registrasi Number'
    },
    sip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Surat Izin Praktik Number'
    },
    sip_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Surat Izin Praktik Number'
    },
    profession: {
      type: DataTypes.ENUM(
        'perawat', 'bidan', 'ahli_gizi', 'kesling', 
        'promkes', 'fisioterapis', 'apoteker', 'radiografer',
        'analis_kesehatan', 'terapis_wicara', 'okupasi_terapis'
      ),
      allowNull: true
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    education: {
      type: DataTypes.STRING,
      allowNull: true
    },
    workplace: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // SatuSehat Integration
    satusehat_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    satusehat_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    satusehat_last_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Verification Status
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    documentsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    documents_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Rating and Reviews
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
    total_appointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Availability
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    availability_schedule: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON object containing weekly schedule'
    },
    
    // Security
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isLocked: {
      type: DataTypes.VIRTUAL,
      get() {
        return !!(this.lockUntil && this.lockUntil > Date.now());
      }
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Firebase Integration
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    
    // Preferences
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email: true,
        sms: true,
        push: true,
        appointment_reminders: true,
        marketing: false
      }
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['nik']
      },
      {
        fields: ['role', 'status']
      },
      {
        fields: ['profession']
      },
      {
        fields: ['city', 'province']
      },
      {
        fields: ['is_available']
      },
      {
        fields: ['average_rating']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });
  
  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
  
  User.prototype.isAccountLocked = function() {
    return !!(this.locked_until && this.locked_until > Date.now());
  };
  
  User.prototype.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.locked_until && this.locked_until < Date.now()) {
      return this.update({
        login_attempts: 1,
        locked_until: null
      });
    }
    
    const updates = { login_attempts: this.login_attempts + 1 };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.login_attempts + 1 >= 5 && !this.isAccountLocked()) {
      updates.locked_until = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    
    return this.update(updates);
  };
  
  User.prototype.resetLoginAttempts = async function() {
    return this.update({
      login_attempts: 0,
      locked_until: null
    });
  };
  
  User.prototype.handleFailedLogin = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.update({
        loginAttempts: 1,
        lockUntil: null
      });
    }
    
    const updates = { loginAttempts: this.loginAttempts + 1 };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
      updates.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    
    return this.update(updates);
  };
  
  User.prototype.updateLastLogin = async function() {
    return this.update({ last_login: new Date() });
  };
  
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.password_reset_token;
    delete values.email_verification_token;
    return values;
  };
  
  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };
  
  User.findByPhone = function(phone) {
    return this.findOne({ where: { phone } });
  };
  
  User.findByNIK = function(nik) {
    return this.findOne({ where: { nik } });
  };
  
  User.findVerifiedNakes = function(options = {}) {
    return this.findAll({
      where: {
        role: 'nakes',
        status: 'active',
        documents_verified: true,
        satusehat_verified: true,
        ...options.where
      },
      ...options
    });
  };
  
  return User;
};