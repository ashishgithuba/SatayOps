const express = require('express');
const router = express.Router();
const allocController = require('../controllers/bedAllocation.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  validateAllocateBed,
  validateCheckout,
  validateTransferBed,
} = require('../validators/bedAllocation.validator');
const { ROLES } = require('../constants/roles');

router.use(protect);

// 1. Allocate bed (POST /allocations)
router.post(
  '/allocations',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  validateAllocateBed,
  allocController.allocateBed
);

// 2. Get All allocations (GET /allocations)
router.get('/allocations', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), allocController.getAllocations);

// Resident specific route to get their own current allocation
router.get('/allocations/my', authorize(ROLES.RESIDENT), allocController.getMyAllocation);

// 3. Get Single allocation by ID (GET /allocations/:id)
router.get('/allocations/:id', authorize(ROLES.OWNER, ROLES.SUPER_ADMIN), allocController.getAllocationById);

// 4. Checkout bed (POST /allocations/:id/checkout)
router.post(
  '/allocations/:id/checkout',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  validateCheckout,
  allocController.checkoutAllocation
);

// 5. Transfer bed (POST /allocations/:id/transfer)
router.post(
  '/allocations/:id/transfer',
  authorize(ROLES.OWNER, ROLES.SUPER_ADMIN),
  validateTransferBed,
  allocController.transferBed
);

// 6. Resident allocation history (GET /residents/:id/allocations)
router.get('/residents/:id/allocations', allocController.getResidentAllocations);

// 7. Resident current stay (GET /residents/:id/current-allocation)
router.get('/residents/:id/current-allocation', allocController.getResidentCurrentAllocation);

module.exports = router;
