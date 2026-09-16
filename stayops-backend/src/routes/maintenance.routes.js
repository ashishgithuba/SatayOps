const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const { ROLES } = require('../constants/roles');

router.use(protect);

// Everyone (including resident) can get and create requests
router.post('/maintenance', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), maintenanceController.createRequest);
router.get('/maintenance', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), maintenanceController.getRequests);
router.get('/maintenance/:id', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), maintenanceController.getRequestById);

// Only owners/admins can update status (like resolving/closing)
router.patch('/maintenance/:id/status', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), maintenanceController.updateRequestStatus);
router.delete('/maintenance/:id', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), maintenanceController.deleteRequest);

module.exports = router;
