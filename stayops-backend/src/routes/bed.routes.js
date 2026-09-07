const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bed.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreateBed, validateUpdateBed } = require('../validators/bed.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

// Create Bed
router.post('/beds', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateCreateBed, bedController.createBed);

// Get All Beds (supports query params: ?room_id=... & ?floor_id=... & ?pg_id=... & ?status=...)
router.get('/beds', bedController.getBeds);

// Get Beds of a Specific Room (Nested Route)
router.get('/rooms/:roomId/beds', (req, res, next) => {
  req.query.room_id = req.params.roomId;
  bedController.getBeds(req, res, next);
});

// Get Single Bed Detail by ID
router.get('/beds/:id', bedController.getBedById);

// Update Bed (PATCH)
router.patch('/beds/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateUpdateBed, bedController.updateBed);

// Delete Bed (DELETE)
router.delete('/beds/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), bedController.deleteBed);

module.exports = router;
