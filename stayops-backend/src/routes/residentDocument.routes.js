const express = require('express');
const router = express.Router();
const docController = require('../controllers/residentDocument.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadDocWithProfile } = require('../middlewares/upload.middleware');
const {
  validateCreateDocument,
  validateUpdateDocument,
  validateVerifyDocument,
} = require('../validators/residentDocument.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

// Create / Upload Document or Profile Photo (supports both 'profile_photo' and 'file' / 'document_file')
router.post(
  '/resident-documents',
  uploadDocWithProfile,
  validateCreateDocument,
  docController.createDocument
);

// Get All Documents of a Specific Resident
router.get('/residents/:residentId/documents', docController.getDocumentsByResident);

// Get Single Document by ID
router.get('/resident-documents/:id', docController.getDocumentById);

// Update Document (PATCH)
router.patch(
  '/resident-documents/:id',
  uploadDocWithProfile,
  validateUpdateDocument,
  docController.updateDocument
);

// Verify Document
router.patch(
  '/resident-documents/:id/verify',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  validateVerifyDocument,
  docController.verifyDocument
);

// Delete Document
router.delete('/resident-documents/:id', docController.deleteDocument);

module.exports = router;
