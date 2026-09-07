const ApiError = require('../utils/ApiError');

const ALLOWED_DOC_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'COLLEGE_ID', 'OTHER'];

const validateCreateDocument = (req, res, next) => {
  const { resident_id } = req.body;

  if (!resident_id) {
    throw new ApiError(400, 'Please provide resident_id');
  }

  const hasFiles = req.files && (req.files.file || req.files.document_file || req.files.profile_photo);

  if (!hasFiles && !req.file && !req.body.document_url) {
    throw new ApiError(400, 'Please upload a photo or document file');
  }

  next();
};

const validateUpdateDocument = (req, res, next) => {
  const { document_type } = req.body;
  if (document_type && !ALLOWED_DOC_TYPES.includes(document_type)) {
    throw new ApiError(400, `document_type must be one of: ${ALLOWED_DOC_TYPES.join(', ')}`);
  }
  next();
};

const validateVerifyDocument = (req, res, next) => {
  const { verified } = req.body;
  if (typeof verified !== 'boolean') {
    throw new ApiError(400, 'Please provide boolean field "verified" (true/false)');
  }
  next();
};

module.exports = {
  validateCreateDocument,
  validateUpdateDocument,
  validateVerifyDocument,
};
