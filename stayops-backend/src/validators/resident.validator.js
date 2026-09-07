const ApiError = require('../utils/ApiError');

const phoneRegex = /^[6-9]\d{9}$/;

const validateCreateResident = (req, res, next) => {
  const full_name = req.body.full_name || req.body.name;
  const phone = req.body.phone;

  if (!full_name || !phone) {
    throw new ApiError(400, 'Please provide full_name and phone');
  }

  if (!phoneRegex.test(String(phone).trim())) {
    throw new ApiError(400, 'Please provide a valid 10-digit mobile number starting with 6, 7, 8 or 9 (e.g. 9876543210)');
  }

  const emergencyPhone = req.body.emergency_contact_phone || req.body.emergency_contact;
  if (emergencyPhone && !phoneRegex.test(String(emergencyPhone).trim())) {
    throw new ApiError(400, 'Please provide a valid 10-digit emergency contact phone number');
  }

  req.body.full_name = full_name;
  next();
};

const validateUpdateResident = (req, res, next) => {
  const { phone, emergency_contact_phone, emergency_contact, gender, status } = req.body;

  if (phone && !phoneRegex.test(String(phone).trim())) {
    throw new ApiError(400, 'Please provide a valid 10-digit mobile number');
  }

  const emergency = emergency_contact_phone || emergency_contact;
  if (emergency && !phoneRegex.test(String(emergency).trim())) {
    throw new ApiError(400, 'Please provide a valid 10-digit emergency contact phone number');
  }

  if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
    throw new ApiError(400, 'Gender must be MALE, FEMALE, or OTHER');
  }

  if (status && !['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
    throw new ApiError(400, 'Status must be ACTIVE, INACTIVE, or BLOCKED');
  }

  next();
};

module.exports = {
  validateCreateResident,
  validateUpdateResident,
};
