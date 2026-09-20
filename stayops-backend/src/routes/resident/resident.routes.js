const express = require('express');
const router = express.Router();
const residentController = require('../../controllers/resident/resident.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { uploadDocWithProfile } = require('../../middlewares/upload.middleware');
const { validateCreateResident, validateUpdateResident } = require('../../validators/resident/resident.validator');
const { ROLES } = require('../../constants/roles');

router.use(protect);

// Create Resident (supports profile photo under 'profile_photo' and document image under 'document_file' or 'file')
router.post(
  '/residents',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  uploadDocWithProfile,
  validateCreateResident,
  residentController.createResident
);

// Get All Residents of Logged In PG Owner
router.get('/residents', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), residentController.getResidents);

// Get Single Resident Detail by ID
router.get('/residents/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), residentController.getResidentById);

// Update Resident (PATCH)
router.patch(
  '/residents/:id',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  uploadDocWithProfile,
  validateUpdateResident,
  residentController.updateResident
);

// Soft Delete Resident (DELETE)
router.delete('/residents/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), residentController.deleteResident);

module.exports = router;
