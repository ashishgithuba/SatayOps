const express = require('express');
const router = express.Router();
const residentController = require('../controllers/resident.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadDocWithProfile } = require('../middlewares/upload.middleware');
const { validateCreateResident, validateUpdateResident } = require('../validators/resident.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);
router.use(authorize(ROLES.OWNER, ROLES.SUPER_ADMIN));

// Create Resident (supports profile photo under 'profile_photo' and document image under 'document_file' or 'file')
router.post(
  '/residents',
  uploadDocWithProfile,
  validateCreateResident,
  residentController.createResident
);

// Get All Residents of Logged In PG Owner
router.get('/residents', residentController.getResidents);

// Get Single Resident Detail by ID
router.get('/residents/:id', residentController.getResidentById);

// Update Resident (PATCH)
router.patch(
  '/residents/:id',
  uploadDocWithProfile,
  validateUpdateResident,
  residentController.updateResident
);

// Soft Delete Resident (DELETE)
router.delete('/residents/:id', residentController.deleteResident);

module.exports = router;
