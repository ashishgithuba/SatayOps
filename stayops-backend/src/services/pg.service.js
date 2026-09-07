const { PG, User } = require('../models');
const ApiError = require('../utils/ApiError');

const createPG = async (pgData, ownerId) => {
  const {
    name,
    description,
    property_type,
    gender_type,
    address_line,
    area,
    city,
    state,
    pincode,
    total_floors,
  } = pgData;

  const pg = await PG.create({
    owner_id: ownerId,
    name,
    description: description || null,
    property_type: property_type || 'PG',
    gender_type,
    address_line,
    area: area || null,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    total_floors: total_floors || 0,
  });

  return pg;
};

const getAllPGs = async (options = {}) => {
  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'phone'],
      },
    ],
    order: [['created_at', 'DESC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await PG.findAndCountAll(queryOptions);

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

const getPGsByOwner = async (ownerId, options = {}) => {
  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: { owner_id: ownerId },
    order: [['created_at', 'DESC']],
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await PG.findAndCountAll(queryOptions);

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

const getPGById = async (id) => {
  const pg = await PG.findByPk(id, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'phone'],
      },
    ],
  });
  if (!pg) {
    throw new ApiError(404, 'PG not found');
  }
  return pg;
};

module.exports = {
  createPG,
  getAllPGs,
  getPGsByOwner,
  getPGById,
};
