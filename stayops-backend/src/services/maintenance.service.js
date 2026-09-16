const { MaintenanceRequest, MaintenanceRequestHistory, Resident, Bed, Room, PG, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { sequelize } = require('../config/database');

const createRequest = async (data, userId) => {
  const { pg_id, resident_id, bed_id, category, title, description, priority } = data;

  // We could add validation to check if pg_id, resident_id exist, but foreign key constraint handles it mostly
  // Create request in transaction just in case
  const transaction = await sequelize.transaction();

  try {
    const request = await MaintenanceRequest.create(
      {
        pg_id,
        resident_id,
        bed_id: bed_id || null,
        category,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
      { transaction }
    );

    await MaintenanceRequestHistory.create(
      {
        maintenance_request_id: request.id,
        new_status: 'OPEN',
        changed_by: userId,
        note: 'Request created',
      },
      { transaction }
    );

    await transaction.commit();
    return request;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getRequests = async (filters) => {
  const { pg_id, resident_id, status, priority, category } = filters;
  const where = {};

  if (pg_id) where.pg_id = pg_id;
  if (resident_id) where.resident_id = resident_id;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;

  return await MaintenanceRequest.findAll({
    where,
    include: [
      {
        model: Resident,
        as: 'resident',
        attributes: ['id', 'full_name', 'phone'],
      },
      {
        model: Bed,
        as: 'bed',
        attributes: ['id', 'bed_number', 'room_id'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

const getRequestById = async (id) => {
  const request = await MaintenanceRequest.findByPk(id, {
    include: [
      {
        model: Resident,
        as: 'resident',
        attributes: ['id', 'full_name', 'phone'],
      },
      {
        model: Bed,
        as: 'bed',
        attributes: ['id', 'bed_number'],
      },
      {
        model: MaintenanceRequestHistory,
        as: 'history',
        include: [
          {
            model: User,
            as: 'changedBy',
            attributes: ['id', 'name', 'role'],
          },
        ],
      },
    ],
    order: [[{ model: MaintenanceRequestHistory, as: 'history' }, 'created_at', 'DESC']],
  });

  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  return request;
};

const updateRequestStatus = async (id, data, userId) => {
  const { status, note, resolution_note } = data;

  const request = await MaintenanceRequest.findByPk(id);
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  if (request.status === status) {
    throw new ApiError(400, `Request is already marked as ${status}`);
  }

  const oldStatus = request.status;
  
  const transaction = await sequelize.transaction();
  try {
    request.status = status;
    
    if (status === 'RESOLVED') {
      request.resolved_at = new Date();
      if (resolution_note) request.resolution_note = resolution_note;
    }
    
    if (status === 'CLOSED') {
      request.closed_at = new Date();
    }

    await request.save({ transaction });

    await MaintenanceRequestHistory.create(
      {
        maintenance_request_id: request.id,
        old_status: oldStatus,
        new_status: status,
        changed_by: userId,
        note: note || `Status updated from ${oldStatus} to ${status}`,
      },
      { transaction }
    );

    await transaction.commit();
    return request;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteRequest = async (id) => {
  const request = await MaintenanceRequest.findByPk(id);
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  await request.destroy();
  return { message: 'Maintenance request deleted successfully' };
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};
