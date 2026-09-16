const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRequestHistory = sequelize.define(
  'MaintenanceRequestHistory',
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
    old_status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'maintenance_request_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    validate: {
      checkStatusChange() {
        if (this.old_status && this.old_status === this.new_status) {
          throw new Error('old_status and new_status cannot be the same');
        }
      },
    },
  }
);

module.exports = MaintenanceRequestHistory;
