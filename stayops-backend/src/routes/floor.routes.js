const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floor.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreateFloor, validateUpdateFloor } = require('../validators/floor.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);
router.use(authorize(ROLES.OWNER, ROLES.SUPER_ADMIN));

// RESTful nested route: /api/pg/:pgId/floors (Automatic pg_id from URL path)
router.post('/pg/:pgId/floors', validateCreateFloor, (req, res, next) => {
  req.body.pg_id = req.params.pgId;
  floorController.createFloor(req, res, next);
});

router.get('/pg/:pgId/floors', floorController.getFloors);

// General routes
router.post('/floors', validateCreateFloor, floorController.createFloor);
router.get('/floors', floorController.getFloors);
router.get('/floors/:id', floorController.getFloorById);
router.patch('/floors/:id', validateUpdateFloor, floorController.updateFloor);
router.delete('/floors/:id', floorController.deleteFloor);

module.exports = router;
