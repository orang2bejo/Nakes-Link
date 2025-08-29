const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true // Enable soft deletes globally
    }
  }
);

// Import models
const User = require('./User')(sequelize);
const Service = require('./Service')(sequelize);
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');
const Payment = require('./Payment');
const Wallet = require('./Wallet');
const WalletTransaction = require('./WalletTransaction');
const Chat = require('./Chat');
const ChatRoom = require('./ChatRoom');
const ChatRoomParticipant = require('./ChatRoomParticipant');
const Notification = require('./Notification');
const Review = require('./Review');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Service, { foreignKey: 'nakes_id', as: 'services', onDelete: 'CASCADE' });
  User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
  User.hasMany(Appointment, { foreignKey: 'nakes_id', as: 'nakesAppointments' });
  User.hasMany(MedicalRecord, { foreignKey: 'patient_id', as: 'patientMedicalRecords' });
  User.hasMany(MedicalRecord, { foreignKey: 'nakes_id', as: 'nakesMedicalRecords' });
  User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
  User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
  User.hasMany(WalletTransaction, { foreignKey: 'user_id', as: 'walletTransactions' });
  User.hasMany(Chat, { foreignKey: 'sender_id', as: 'sentMessages' });
  User.hasMany(ChatRoom, { foreignKey: 'created_by', as: 'createdChatRooms' });
  User.hasMany(ChatRoom, { foreignKey: 'closed_by', as: 'closedChatRooms' });
  User.hasMany(ChatRoomParticipant, { foreignKey: 'user_id', as: 'chatRoomParticipations' });
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  User.hasMany(Review, { foreignKey: 'patient_id', as: 'patientReviews' });
  User.hasMany(Review, { foreignKey: 'nakes_id', as: 'nakesReviews' });

  // Service associations
  Service.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes', onDelete: 'CASCADE' });
  Service.hasMany(Appointment, { foreignKey: 'service_id', as: 'appointments' });
  Service.hasMany(Review, { foreignKey: 'service_id', as: 'reviews' });

  // Appointment associations
  Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  Appointment.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
  Appointment.hasMany(MedicalRecord, { foreignKey: 'appointment_id', as: 'medicalRecords' });
  Appointment.hasMany(Payment, { foreignKey: 'appointment_id', as: 'payments' });
  Appointment.hasOne(ChatRoom, { foreignKey: 'appointment_id', as: 'chatRoom' });
  Appointment.hasOne(Review, { foreignKey: 'appointment_id', as: 'review' });

  // MedicalRecord associations
  MedicalRecord.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  MedicalRecord.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

  // Payment associations
  Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Payment.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
  Payment.hasMany(WalletTransaction, { foreignKey: 'payment_id', as: 'walletTransactions' });

  // Wallet associations
  Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });

  // WalletTransaction associations
  WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
  WalletTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  WalletTransaction.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

  // Chat associations
  Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
  Chat.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'chatRoom' });
  Chat.belongsTo(Chat, { foreignKey: 'reply_to_message_id', as: 'replyToMessage' });
  Chat.hasMany(Chat, { foreignKey: 'reply_to_message_id', as: 'replies' });

  // ChatRoom associations
  ChatRoom.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  ChatRoom.belongsTo(User, { foreignKey: 'closed_by', as: 'closedBy' });
  ChatRoom.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
  ChatRoom.belongsTo(Chat, { foreignKey: 'last_message_id', as: 'lastMessage' });
  ChatRoom.hasMany(Chat, { foreignKey: 'room_id', as: 'messages' });
  ChatRoom.hasMany(ChatRoomParticipant, { foreignKey: 'room_id', as: 'participants' });

  // ChatRoomParticipant associations
  ChatRoomParticipant.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'chatRoom' });
  ChatRoomParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  ChatRoomParticipant.belongsTo(Chat, { foreignKey: 'last_read_message_id', as: 'lastReadMessage' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

  // Review associations
  Review.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
  Review.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  Review.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  Review.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
  Review.belongsTo(User, { foreignKey: 'moderated_by', as: 'moderator' });
};

// Initialize associations
defineAssociations();

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    throw error;
  }
};

// Sync database (create tables)
const syncDatabase = async (options = {}) => {
  try {
    const { force = false, alter = false } = options;
    
    if (force) {
      console.log('⚠️  Force syncing database (this will drop existing tables)...');
    } else if (alter) {
      console.log('🔄 Altering database tables to match models...');
    } else {
      console.log('🔄 Syncing database tables...');
    }
    
    await sequelize.sync({ force, alter });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    throw error;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
    throw error;
  }
};

// Export models and utilities
module.exports = {
  sequelize,
  Sequelize,
  
  // Models
  User,
  Service,
  Appointment,
  MedicalRecord,
  Payment,
  Wallet,
  WalletTransaction,
  Chat,
  ChatRoom,
  ChatRoomParticipant,
  Notification,
  Review,
  
  // Utilities
  testConnection,
  syncDatabase,
  closeConnection,
  
  // For dynamic model loading
  models: {
    User,
    Service,
    Appointment,
    MedicalRecord,
    Payment,
    Wallet,
    WalletTransaction,
    Chat,
    ChatRoom,
    ChatRoomParticipant,
    Notification,
    Review
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeConnection();
  process.exit(0);
});