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

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Service, {
    foreignKey: 'nakes_id',
    as: 'services',
    onDelete: 'CASCADE'
  });

  // Service associations
  Service.belongsTo(User, {
    foreignKey: 'nakes_id',
    as: 'nakes',
    onDelete: 'CASCADE'
  });

  // Add more associations as models are created
  // Example:
  // User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patientAppointments' });
  // User.hasMany(Appointment, { foreignKey: 'nakes_id', as: 'nakesAppointments' });
  // Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
  // Appointment.belongsTo(User, { foreignKey: 'nakes_id', as: 'nakes' });
  // Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
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
  
  // Utilities
  testConnection,
  syncDatabase,
  closeConnection,
  
  // For dynamic model loading
  models: {
    User,
    Service
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