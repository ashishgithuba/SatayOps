const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floor.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreateFloor, validateUpdateFloor } = require('../validators/floor.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

// RESTful nested route: /api/pg/:pgId/floors (Automatic pg_id from URL path)
router.post('/pg/:pgId/floors', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateCreateFloor, (req, res, next) => {
  req.body.pg_id = req.params.pgId;
  floorController.createFloor(req, res, next);
});

router.get('/pg/:pgId/floors', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), floorController.getFloors);

// General routes
router.post('/floors', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateCreateFloor, floorController.createFloor);
router.get('/floors', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), floorController.getFloors);
router.get('/floors/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), floorController.getFloorById);
router.patch('/floors/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), validateUpdateFloor, floorController.updateFloor);
router.delete('/floors/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), floorController.deleteFloor);

module.exports = router;
