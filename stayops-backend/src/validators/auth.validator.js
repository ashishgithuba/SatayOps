const ApiError = require('../utils/ApiError');

const validateRegister = (req, res, next) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'Please provide name, email, phone, and password');
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }
  next();
};

const validateUpdateUser = (req, res, next) => {
  // Allow updating fields like name, phone, profile_image, role, status
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
};
