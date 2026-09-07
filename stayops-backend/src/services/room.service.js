const { Room, Floor, PG } = require('../models');
const ApiError = require('../utils/ApiError');

const createRoom = async (roomData, ownerId) => {
  const { pg_id, floor_id, room_number, room_type, description, status } = roomData;

  // Check if floor exists
  const floor = await Floor.findByPk(floor_id);
  if (!floor) {
    throw new ApiError(404, 'Floor not found with given floor_id');
  }

  const targetPgId = pg_id || floor.pg_id;

  // Verify PG exists
  const pgExists = await PG.findByPk(targetPgId);
  if (!pgExists) {
    throw new ApiError(404, 'PG not found');
  }

  // Check unique (pg_id, room_number) constraint
  const existingRoom = await Room.findOne({
    where: { pg_id: targetPgId, room_number },
  });

  if (existingRoom) {
    throw new ApiError(400, `Room number '${room_number}' already exists in this PG`);
  }

  const room = await Room.create({
    pg_id: targetPgId,
    floor_id,
    room_number,
    room_type: room_type || null,
    description: description || null,
    status: status || 'ACTIVE',
  });

  return room;
};

// Get all rooms of a PG (or auto-detect owner PG)
const getRoomsByPg = async (ownerId, pg_id, options = {}) => {
  let targetPgId = pg_id;

  if (!targetPgId) {
    const ownerPg = await PG.findOne({ where: { owner_id: ownerId } });
    if (!ownerPg) {
      throw new ApiError(404, 'No PG found for this Owner');
    }
    targetPgId = ownerPg.id;
  }

  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: { pg_id: targetPgId },
    include: [
      { model: Floor, as: 'floor', attributes: ['id', 'floor_number', 'name'] },
    ],
    order: [['room_number', 'ASC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await Room.findAndCountAll(queryOptions);

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

// Get all rooms of a specific Floor
const getRoomsByFloor = async (floor_id, options = {}) => {
  const floor = await Floor.findByPk(floor_id);
  if (!floor) {
    throw new ApiError(404, 'Floor not found');
  }

  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: { floor_id },
    include: [
      { model: Floor, as: 'floor', attributes: ['id', 'floor_number', 'name'] },
    ],
    order: [['room_number', 'ASC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await Room.findAndCountAll(queryOptions);

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

// Get single room by ID
const getRoomById = async (id) => {
  const room = await Room.findByPk(id, {
    include: [
      { model: PG, as: 'pg', attributes: ['id', 'name'] },
      { model: Floor, as: 'floor', attributes: ['id', 'floor_number', 'name'] },
    ],
  });

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  return room;
};

// Update room
const updateRoom = async (id, updateData) => {
  const room = await Room.findByPk(id);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  const { room_number, room_type, description, status, floor_id } = updateData;

  if (room_number && room_number !== room.room_number) {
    const existingRoom = await Room.findOne({
      where: { pg_id: room.pg_id, room_number },
    });

    if (existingRoom) {
      throw new ApiError(400, `Room number '${room_number}' already exists in this PG`);
    }
    room.room_number = room_number;
  }

  if (floor_id) {
    const floor = await Floor.findByPk(floor_id);
    if (!floor) {
      throw new ApiError(404, 'Floor not found');
    }
    room.floor_id = floor_id;
  }

  if (room_type !== undefined) room.room_type = room_type;
  if (description !== undefined) room.description = description;
  if (status) room.status = status;

  await room.save();
  return room;
};

// Change room status only
const changeRoomStatus = async (id, status) => {
  const room = await Room.findByPk(id);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  room.status = status;
  await room.save();
  return room;
};

// Soft delete room
const deleteRoom = async (id) => {
  const room = await Room.findByPk(id);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  await room.destroy(); // Performs soft delete because paranoid: true
  return { id };
};

module.exports = {
  createRoom,
  getRoomsByPg,
  getRoomsByFloor,
  getRoomById,
  updateRoom,
  changeRoomStatus,
  deleteRoom,
};
