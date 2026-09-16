const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'stayops_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected successfully via Sequelize.');
    // Load models & associations
    require('../models');
    // Synchronize DB schema (creates new tables & alters columns)
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
