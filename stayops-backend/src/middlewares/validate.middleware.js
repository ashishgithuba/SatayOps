const ApiError = require('../utils/ApiError');

const validate = (validatorSchema) => (req, res, next) => {
  if (typeof validatorSchema === 'function') {
    return validatorSchema(req, res, next);
  }
  next();
};

module.exports = validate;
