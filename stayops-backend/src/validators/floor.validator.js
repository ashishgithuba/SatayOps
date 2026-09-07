const ApiError = require('../utils/ApiError');

const validateCreateFloor = (req, res, next) => {
  const { floor_number } = req.body;
  if (floor_number === undefined || floor_number === null) {
    throw new ApiError(400, 'Please provide floor_number');
  }
  next();
};

const validateUpdateFloor = (req, res, next) => {
  next();
};

module.exports = {
  validateCreateFloor,
  validateUpdateFloor,
};
