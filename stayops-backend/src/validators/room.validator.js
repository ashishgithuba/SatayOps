const ApiError = require('../utils/ApiError');

const validateCreateRoom = (req, res, next) => {
  const { floor_id, room_number } = req.body;
  if (!floor_id || !room_number) {
    throw new ApiError(400, 'Please provide floor_id and room_number');
  }
  next();
};

const validateUpdateRoom = (req, res, next) => {
  const { status } = req.body;
  if (status && !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
    throw new ApiError(400, 'Status must be ACTIVE, INACTIVE, or MAINTENANCE');
  }
  next();
};

const validateChangeStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
    throw new ApiError(400, 'Please provide valid status (ACTIVE, INACTIVE, MAINTENANCE)');
  }
  next();
};

module.exports = {
  validateCreateRoom,
  validateUpdateRoom,
  validateChangeStatus,
};
