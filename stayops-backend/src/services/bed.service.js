const { Bed, Room, Floor, PG } = require('../models');
const ApiError = require('../utils/ApiError');

const createBed = async (bedData, ownerId) => {
  const { pg_id, floor_id, room_id, bed_number, status, description, default_rent, default_security_deposit } = bedData;

  // Verify room exists
  const room = await Room.findByPk(room_id);
  if (!room) {
    throw new ApiError(404, 'Room not found with given room_id');
  }

  // Auto-detect floor_id and pg_id from room if not passed
  const targetFloorId = floor_id || room.floor_id;
  const targetPgId = pg_id || room.pg_id;

  const ROOM_CAPACITY = {
    SINGLE: 1,
    DOUBLE_SHARING: 2,
    TRIPLE_SHARING: 3,
    FOUR_SHARING: 4,
    DORMITORY: 50,
  };

  const maxCapacity = ROOM_CAPACITY[room.room_type] || 50;
  const currentBedCount = await Bed.count({ where: { room_id } });
  if (currentBedCount >= maxCapacity) {
    throw new ApiError(
      400,
      `Cannot add bed. Maximum capacity of ${maxCapacity} bed(s) reached for ${room.room_type ? room.room_type.replace('_', ' ') : 'this room'}.`
    );
  }

  // Check unique_room_bed_number constraint (room_id, bed_number)
  const existingRoomBed = await Bed.findOne({
    where: { room_id, bed_number },
  });
  if (existingRoomBed) {
    throw new ApiError(400, `Bed number '${bed_number}' already exists in this room`);
  }

  const bed = await Bed.create({
    pg_id: targetPgId,
    floor_id: targetFloorId,
    room_id,
    bed_number,
    status: status || 'AVAILABLE',
    description: description || null,
    default_rent: default_rent || 0,
    default_security_deposit: default_security_deposit || 0,
  });

  return bed;
};

// Get all beds (with optional filter by room_id, floor_id, or pg_id)
const getBeds = async (ownerId, query = {}) => {
  const { room_id, floor_id, pg_id, status } = query;
  const whereClause = {};

  if (room_id) whereClause.room_id = room_id;
  if (floor_id) whereClause.floor_id = floor_id;
  if (status) whereClause.status = status;

  let targetPgId = pg_id;
  if (!targetPgId && !room_id && !floor_id) {
    const ownerPg = await PG.findOne({ where: { owner_id: ownerId } });
    if (ownerPg) targetPgId = ownerPg.id;
  }
  if (targetPgId) whereClause.pg_id = targetPgId;

  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: whereClause,
    include: [
      { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
      { model: Floor, as: 'floor', attributes: ['id', 'floor_number', 'name'] },
      { model: PG, as: 'pg', attributes: ['id', 'name'] },
    ],
    order: [['bed_number', 'ASC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await Bed.findAndCountAll(queryOptions);

  return {
    rows,
    pagination: {
      total: count,
      page: isPaginated ? page : 1,
      limit: isPaginated ? limit : count || 10,
      totalPages: isPaginated ? Math.ceil(count / limit) || 1 : 1,
    },
  };
};

// Get single bed by ID
const getBedById = async (id) => {
  const bed = await Bed.findByPk(id, {
    include: [
      { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
      { model: Floor, as: 'floor', attributes: ['id', 'floor_number', 'name'] },
      { model: PG, as: 'pg', attributes: ['id', 'name'] },
    ],
  });

  if (!bed) {
    throw new ApiError(404, 'Bed not found');
  }

  return bed;
};

// Update bed
const updateBed = async (id, updateData) => {
  const bed = await Bed.findByPk(id);

  if (!bed) {
    throw new ApiError(404, 'Bed not found');
  }

  const { bed_number, status, description, room_id, default_rent, default_security_deposit } = updateData;

  const targetRoomId = room_id || bed.room_id;

  if (bed_number && (bed_number !== bed.bed_number || targetRoomId !== bed.room_id)) {
    const existingRoomBed = await Bed.findOne({
      where: { room_id: targetRoomId, bed_number },
    });
    if (existingRoomBed && existingRoomBed.id !== bed.id) {
      throw new ApiError(400, `Bed number '${bed_number}' already exists in this room`);
    }
    bed.bed_number = bed_number;
  }

  if (room_id) {
    const room = await Room.findByPk(room_id);
    if (!room) {
      throw new ApiError(404, 'Room not found with given room_id');
    }
    bed.room_id = room_id;
    bed.floor_id = room.floor_id;
    bed.pg_id = room.pg_id;
  }

  if (status) bed.status = status;
  if (description !== undefined) bed.description = description;
  if (default_rent !== undefined) bed.default_rent = default_rent;
  if (default_security_deposit !== undefined) bed.default_security_deposit = default_security_deposit;

  await bed.save();
  return bed;
};

// Soft delete bed
const deleteBed = async (id) => {
  const bed = await Bed.findByPk(id);

  if (!bed) {
    throw new ApiError(404, 'Bed not found');
  }

  await bed.destroy();
  return { id };
};

module.exports = {
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
};
