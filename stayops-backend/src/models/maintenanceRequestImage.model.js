const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRequestImage = sequelize.define(
  'MaintenanceRequestImage',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    maintenance_request_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: 'maintenance_request_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = MaintenanceRequestImage;
