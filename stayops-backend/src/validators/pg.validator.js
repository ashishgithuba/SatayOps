const ApiError = require('../utils/ApiError');

const validateCreatePG = (req, res, next) => {
  const { name, gender_type, address_line } = req.body;
  if (!name || !gender_type || !address_line) {
    throw new ApiError(400, 'Please provide name, gender_type (MALE/FEMALE/CO_LIVING), and address_line');
  }
  next();
};

module.exports = {
  validateCreatePG,
};
