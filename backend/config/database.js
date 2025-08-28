const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'nakeslink_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME + '_test' || 'nakeslink_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Import models
const User = require('../models/User')(sequelize);
const Service = require('../models/Service')(sequelize);
const Appointment = require('../models/Appointment')(sequelize);
const MedicalRecord = require('../models/MedicalRecord')(sequelize);
const Payment = require('../models/Payment')(sequelize);
const Review = require('../models/Review')(sequelize);
const Wallet = require('../models/Wallet')(sequelize);
const Chat = require('../models/Chat')(sequelize);
const Message = require('../models/Message')(sequelize);
const EmergencyLog = require('../models/EmergencyLog')(sequelize);
const Document = require('../models/Document')(sequelize);
const Notification = require('../models/Notification')(sequelize);
const Link = require('../models/Link')(sequelize);
const Todo = require('../models/Todo')(sequelize);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Service, { foreignKey: 'nakes_id', as: 'services' });
  User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
  User.hasMany(Appointment, { foreignKey: 'nakes_id', as: 'nakesAppointments' });
  User.hasMany(MedicalRecord, { foreignKey: 'patient_id', as: 'medicalRecords' });
  User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
  User.hasMany(Review, { foreignKey: 'patient_id', as: 'givenReviews' });
  User.hasMany(Review, { foreignKey: 'nakes_id', as: 'receivedReviews' });
  User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
  User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  User.hasMany(Link, { foreignKey: 'user_id', as: 'links' });
  User.hasMany(Todo, { foreignKey: 'user_id', as: 'todos' });

  // Service associations
  Service.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  Service.hasMany(Appointment, { foreignKey: 'service_id', as: 'appointments' });

  // Appointment associations
  Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  Appointment.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
  Appointment.hasMany(MedicalRecord, { foreignKey: 'appointment_id', as: 'medicalRecords' });
  Appointment.hasOne(Payment, { foreignKey: 'appointment_id', as: 'payment' });
  Appointment.hasOne(Review, { foreignKey: 'appointment_id', as: 'review' });
  Appointment.hasOne(Chat, { foreignKey: 'appointment_id', as: 'chat' });

  // Medical Record associations
  MedicalRecord.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  MedicalRecord.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

  // Payment associations
  Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Payment.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

  // Review associations
  Review.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  Review.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  Review.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

  // Wallet associations
  Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Chat associations
  Chat.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
  Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });

  // Message associations
  Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });
  Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

  // Document associations
  Document.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Link associations
  Link.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Todo associations
  Todo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

// Initialize associations
defineAssociations();

// Export models and sequelize instance
module.exports = {
  sequelize,
  testConnection,
  models: {
    User,
    Service,
    Appointment,
    MedicalRecord,
    Payment,
    Review,
    Wallet,
    Chat,
    Message,
    EmergencyLog,
    Document,
    Notification,
    Link,
    Todo
  }
};

// Export for Sequelize CLI
module.exports.development = config.development;
module.exports.test = config.test;
module.exports.production = config.production;