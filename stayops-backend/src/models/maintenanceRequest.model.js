const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRequest = sequelize.define(
  'MaintenanceRequest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pg_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    resident_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    bed_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
        'PLUMBING',
        'ELECTRICITY',
        'CLEANING',
        'WIFI',
        'BED_ROOM',
        'FURNITURE',
        'WATER',
        'OTHER'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'OPEN',
    },
    resolution_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'maintenance_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    validate: {
      checkResolvedAt() {
        if (this.status === 'RESOLVED' && !this.resolved_at) {
          throw new Error('resolved_at is required when status is RESOLVED');
        }
      },
      checkClosedAt() {
        if (this.status === 'CLOSED' && !this.closed_at) {
          throw new Error('closed_at is required when status is CLOSED');
        }
      },
    },
  }
);

module.exports = MaintenanceRequest;
