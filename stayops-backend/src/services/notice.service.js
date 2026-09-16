const { Notice, NoticeRecipient, Resident, BedAllocation, Room, Floor, User } = require('../models');
const { sequelize } = require('../config/database');
const ApiError = require('../utils/ApiError');

const createNotice = async (data, userId) => {
  const { pg_id, title, description, type, priority, status, target_type, target_ids } = data;

  const transaction = await sequelize.transaction();

  try {
    // 1. Create Notice
    const notice = await Notice.create(
      {
        pg_id,
        created_by: userId,
        title,
        description,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        status: status || 'DRAFT',
        target_type: target_type || 'ALL_RESIDENTS',
        published_at: status === 'PUBLISHED' ? new Date() : null,
      },
      { transaction }
    );

    // 2. If PUBLISHED, assign recipients immediately
    if (status === 'PUBLISHED') {
      await assignRecipients(notice, target_ids, transaction);
    }

    await transaction.commit();
    return notice;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const assignRecipients = async (notice, targetIds, transaction) => {
  let residentIds = [];

  if (notice.target_type === 'ALL_RESIDENTS') {
    const residents = await Resident.findAll({
      where: { owner_id: notice.created_by, status: 'ACTIVE' },
      attributes: ['id'],
      transaction,
    });
    residentIds = residents.map((r) => r.id);
  } else if (notice.target_type === 'FLOOR') {
    // targetIds should contain an array of floor IDs
    const allocations = await BedAllocation.findAll({
      include: [
        {
          model: Room,
          as: 'room',
          where: { floor_id: targetIds },
          attributes: [],
        },
      ],
      where: { pg_id: notice.pg_id, status: 'ACTIVE' },
      attributes: ['resident_id'],
      transaction,
    });
    residentIds = [...new Set(allocations.map((a) => a.resident_id))];
  } else if (notice.target_type === 'ROOM') {
    // targetIds should contain an array of room IDs
    const allocations = await BedAllocation.findAll({
      where: { pg_id: notice.pg_id, room_id: targetIds, status: 'ACTIVE' },
      attributes: ['resident_id'],
      transaction,
    });
    residentIds = [...new Set(allocations.map((a) => a.resident_id))];
  } else if (notice.target_type === 'SPECIFIC_RESIDENT') {
    residentIds = targetIds || [];
  }

  if (residentIds.length > 0) {
    const recipientsData = residentIds.map((id) => ({
      notice_id: notice.id,
      resident_id: id,
      is_read: false,
    }));
    await NoticeRecipient.bulkCreate(recipientsData, { transaction, ignoreDuplicates: true });
  }
};

const getNotices = async (filters) => {
  const { pg_id, status, type } = filters;
  const where = {};
  
  if (pg_id) where.pg_id = pg_id;
  if (status) where.status = status;
  if (type) where.type = type;

  return await Notice.findAll({
    where,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

const updateNoticeStatus = async (id, status, targetIds, userId) => {
  const notice = await Notice.findByPk(id);
  if (!notice) throw new ApiError(404, 'Notice not found');

  const transaction = await sequelize.transaction();
  try {
    notice.status = status;
    
    if (status === 'PUBLISHED' && !notice.published_at) {
      notice.published_at = new Date();
      await assignRecipients(notice, targetIds, transaction);
    }

    await notice.save({ transaction });
    await transaction.commit();
    
    return notice;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteNotice = async (id) => {
  const notice = await Notice.findByPk(id);
  if (!notice) throw new ApiError(404, 'Notice not found');
  await notice.destroy();
  return { message: 'Notice deleted successfully' };
};

module.exports = {
  createNotice,
  getNotices,
  updateNoticeStatus,
  deleteNotice,
};
