const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notice = sequelize.define(
  'Notice',
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
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
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
    type: {
      type: DataTypes.ENUM('GENERAL', 'MAINTENANCE', 'PAYMENT', 'RULE', 'EMERGENCY', 'EVENT', 'OTHER'),
      allowNull: false,
      defaultValue: 'GENERAL',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'NORMAL',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    target_type: {
      type: DataTypes.ENUM('ALL_RESIDENTS', 'FLOOR', 'ROOM', 'SPECIFIC_RESIDENT'),
      allowNull: false,
      defaultValue: 'ALL_RESIDENTS',
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    validate: {
      checkPublishedAt() {
        if (this.status === 'PUBLISHED' && !this.published_at) {
          throw new Error('published_at is required when status is PUBLISHED');
        }
      },
      checkExpiry() {
        if (this.expires_at && this.published_at && new Date(this.expires_at) <= new Date(this.published_at)) {
          throw new Error('expires_at must be after published_at');
        }
      },
    },
  }
);

module.exports = Notice;
