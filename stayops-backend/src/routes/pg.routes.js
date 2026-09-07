const express = require('express');
const router = express.Router();
const pgController = require('../controllers/pg.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateCreatePG } = require('../validators/pg.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

router
  .route('/')
  .get(pgController.getAllPGs)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.OWNER), validateCreatePG, pgController.createPG);

router.get('/my-pgs', authorize(ROLES.OWNER), pgController.getMyPGs);

router.route('/:id').get(pgController.getPGById);

module.exports = router;
