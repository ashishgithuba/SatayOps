const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const pgRoutes = require('./pg.routes');
const floorRoutes = require('./floor.routes');
const roomRoutes = require('./room.routes');
const bedRoutes = require('./bed.routes');
const bedAllocationRoutes = require('./bedAllocation.routes');
const residentRoutes = require('./resident/resident.routes');
const residentDocumentRoutes = require('./resident/residentDocument.routes');
const rentInvoiceRoutes = require('./rentInvoice.routes');
const paymentRoutes = require('./payment.routes');
const maintenanceRoutes = require('./maintenance.routes');
const noticeRoutes = require('./notice.routes');

router.use('/auth', authRoutes);
router.use('/pg', pgRoutes);
router.use('/', floorRoutes);
router.use('/', roomRoutes);
router.use('/', bedRoutes);
router.use('/', bedAllocationRoutes);
router.use('/', residentRoutes);
router.use('/', residentDocumentRoutes);
router.use('/', rentInvoiceRoutes);
router.use('/', paymentRoutes);
router.use('/', maintenanceRoutes);
router.use('/', noticeRoutes);

module.exports = router;
