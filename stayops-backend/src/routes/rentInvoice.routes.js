const express = require('express');
const router = express.Router();
const rentInvoiceController = require('../controllers/rentInvoice.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const { ROLES } = require('../constants/roles');

router.use(protect);

// Owner only endpoints
router.post('/invoices/generate', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), rentInvoiceController.generateInvoices);
router.post('/invoices', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), rentInvoiceController.createInvoice);

// Accessible by both Owner and Resident (Controller will handle data isolation)
router.get('/invoices', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), rentInvoiceController.getInvoices);
router.get('/invoices/:id', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), rentInvoiceController.getInvoiceById);

module.exports = router;
