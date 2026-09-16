const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const { ROLES } = require('../constants/roles');

router.use(protect);

// Flow 1: Direct payment recording by owner
router.post('/payments', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), paymentController.recordPayment);

// Flow 2: Log a resident payment request (pending verification) - accessible by Resident!
router.post('/payments/request', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), paymentController.createPaymentRequest);

// Flow 2: Owner approves a pending payment
router.patch('/payments/:id/approve', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), paymentController.approvePaymentRequest);

// Flow 2: Owner rejects a pending payment
router.patch('/payments/:id/reject', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), paymentController.rejectPaymentRequest);

// Get all payments history
router.get('/payments', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), paymentController.getPayments);

// Get only pending verification requests
router.get('/payments/pending', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), paymentController.getPendingRequests);

module.exports = router;
