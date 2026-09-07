const { Floor, PG } = require('../models');
const ApiError = require('../utils/ApiError');

const createFloor = async (floorData, ownerId) => {
  const { pg_id, floor_number, name } = floorData;

  let targetPgId = pg_id;

  // If pg_id is not passed, find the PG owned by this logged-in PG Owner
  if (!targetPgId) {
    const ownerPg = await PG.findOne({ where: { owner_id: ownerId } });
    if (!ownerPg) {
      throw new ApiError(404, 'No PG found associated with this Owner');
    }
    targetPgId = ownerPg.id;
  } else {
    const pgExists = await PG.findByPk(targetPgId);
    if (!pgExists) {
      throw new ApiError(404, 'PG not found with given pg_id');
    }
  }

  // Check for unique (pg_id, floor_number) constraint
  const existingFloor = await Floor.findOne({
    where: { pg_id: targetPgId, floor_number },
  });

  if (existingFloor) {
    throw new ApiError(400, `Floor number ${floor_number} already exists in this PG`);
  }

  const floor = await Floor.create({
    pg_id: targetPgId,
    floor_number,
    name: name || null,
  });

  return floor;
};

const getFloorsByOwnerOrPg = async (ownerId, pg_id, options = {}) => {
  let targetPgId = pg_id;

  if (!targetPgId) {
    const ownerPg = await PG.findOne({ where: { owner_id: ownerId } });
    if (!ownerPg) {
      throw new ApiError(404, 'No PG found associated with this Owner');
    }
    targetPgId = ownerPg.id;
  }

  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: { pg_id: targetPgId },
    order: [['floor_number', 'ASC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await Floor.findAndCountAll(queryOptions);

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

const getFloorById = async (id) => {
  const floor = await Floor.findByPk(id, {
    include: [{ model: PG, as: 'pg', attributes: ['id', 'name'] }],
  });

  if (!floor) {
    throw new ApiError(404, 'Floor not found');
  }

  return floor;
};

const updateFloor = async (id, updateData) => {
  const floor = await Floor.findByPk(id);

  if (!floor) {
    throw new ApiError(404, 'Floor not found');
  }

  const { floor_number, name } = updateData;

  if (floor_number !== undefined && floor_number !== floor.floor_number) {
    const existingFloor = await Floor.findOne({
      where: { pg_id: floor.pg_id, floor_number },
    });

    if (existingFloor) {
      throw new ApiError(400, `Floor number ${floor_number} already exists in this PG`);
    }
    floor.floor_number = floor_number;
  }

  if (name !== undefined) {
    floor.name = name;
  }

  await floor.save();
  return floor;
};

const deleteFloor = async (id) => {
  const floor = await Floor.findByPk(id);

  if (!floor) {
    throw new ApiError(404, 'Floor not found');
  }

  await floor.destroy();
  return { id };
};

module.exports = {
  createFloor,
  getFloorsByOwnerOrPg,
  getFloorById,
  updateFloor,
  deleteFloor,
};
