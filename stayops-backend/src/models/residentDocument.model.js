const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ResidentDocument = sequelize.define(
  'ResidentDocument',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    resident_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    document_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'COLLEGE_ID', 'OTHER']],
      },
    },
    document_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    document_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'resident_documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = ResidentDocument;
