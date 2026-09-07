const ApiError = require('../utils/ApiError');

const ALLOWED_BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];

const validateCreateBed = (req, res, next) => {
  const { room_id, bed_number, status } = req.body;

  if (!room_id || !bed_number) {
    throw new ApiError(400, 'Please provide room_id and bed_number');
  }

  if (status && !ALLOWED_BED_STATUSES.includes(status)) {
    throw new ApiError(400, `Bed status must be one of: ${ALLOWED_BED_STATUSES.join(', ')}`);
  }

  next();
};

const validateUpdateBed = (req, res, next) => {
  const { status } = req.body;

  if (status && !ALLOWED_BED_STATUSES.includes(status)) {
    throw new ApiError(400, `Bed status must be one of: ${ALLOWED_BED_STATUSES.join(', ')}`);
  }

  next();
};

module.exports = {
  validateCreateBed,
  validateUpdateBed,
};
