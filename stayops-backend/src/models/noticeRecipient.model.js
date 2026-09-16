const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NoticeRecipient = sequelize.define(
  'NoticeRecipient',
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
    resident_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notice_recipients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    validate: {
      checkReadAt() {
        if (this.is_read && !this.read_at) {
          throw new Error('read_at is required when is_read is true');
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['notice_id', 'resident_id'],
      },
    ],
  }
);

module.exports = NoticeRecipient;
