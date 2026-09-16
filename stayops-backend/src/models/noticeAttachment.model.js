const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NoticeAttachment = sequelize.define(
  'NoticeAttachment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    notice_id: {
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
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: 'notice_attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = NoticeAttachment;
