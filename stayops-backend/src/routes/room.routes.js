const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreateRoom, validateUpdateRoom, validateChangeStatus } = require('../validators/room.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);
router.use(authorize(ROLES.OWNER, ROLES.SUPER_ADMIN));

// Create Room
router.post('/rooms', validateCreateRoom, roomController.createRoom);

// Get All Rooms for a PG
router.get('/pg/:pgId/rooms', roomController.getRoomsByPg);
router.get('/rooms', roomController.getRoomsByPg);

// Get All Rooms for a Specific Floor
router.get('/floors/:floorId/rooms', roomController.getRoomsByFloor);

// Get Single Room by ID
router.get('/rooms/:id', roomController.getRoomById);

// Update Room (PATCH)
router.patch('/rooms/:id', validateUpdateRoom, roomController.updateRoom);

// Change Status Only (PATCH /rooms/:id/status)
router.patch('/rooms/:id/status', validateChangeStatus, roomController.changeRoomStatus);

// Delete Room (Soft Delete)
router.delete('/rooms/:id', roomController.deleteRoom);

module.exports = router;
