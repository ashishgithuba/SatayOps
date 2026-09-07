const ApiError = require('../utils/ApiError');

const validateAllocateBed = (req, res, next) => {
  const check_in_date = req.body.check_in_date || req.body.start_date || new Date().toISOString().split('T')[0];
  const monthly_rent = req.body.monthly_rent !== undefined ? req.body.monthly_rent : req.body.agreed_rent;
  const { resident_id, bed_id } = req.body;

  if (!resident_id || !bed_id || !check_in_date || monthly_rent === undefined) {
    throw new ApiError(400, 'Please provide resident_id, bed_id, check_in_date (or start_date), and monthly_rent (or agreed_rent)');
  }

  if (Number(monthly_rent) < 0) {
    throw new ApiError(400, 'monthly_rent must be >= 0');
  }

  req.body.check_in_date = check_in_date;
  req.body.monthly_rent = monthly_rent;

  next();
};

const validateCheckout = (req, res, next) => {
  if (!req.body.check_out_date) {
    req.body.check_out_date = new Date().toISOString().split('T')[0];
  }

  next();
};

const validateTransferBed = (req, res, next) => {
  const { new_bed_id, transfer_date } = req.body;

  if (!new_bed_id) {
    throw new ApiError(400, 'Please provide new_bed_id for bed transfer');
  }

  next();
};

module.exports = {
  validateAllocateBed,
  validateCheckout,
  validateTransferBed,
};
