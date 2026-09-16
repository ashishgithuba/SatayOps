const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreateRoom, validateUpdateRoom, validateChangeStatus } = require('../validators/room.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

// Create Room
router.post('/rooms', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateCreateRoom, roomController.createRoom);

// Get All Rooms for a PG
router.get('/pg/:pgId/rooms', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), roomController.getRoomsByPg);
router.get('/rooms', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), roomController.getRoomsByPg);

// Get All Rooms for a Specific Floor
router.get('/floors/:floorId/rooms', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), roomController.getRoomsByFloor);

// Get Single Room by ID
router.get('/rooms/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), roomController.getRoomById);

// Update Room (PATCH)
router.patch('/rooms/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateUpdateRoom, roomController.updateRoom);

// Change Status Only (PATCH /rooms/:id/status)
router.patch('/rooms/:id/status', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateChangeStatus, roomController.changeRoomStatus);

// Delete Room (Soft Delete)
router.delete('/rooms/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), roomController.deleteRoom);

module.exports = router;
