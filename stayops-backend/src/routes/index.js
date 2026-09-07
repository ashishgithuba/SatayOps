const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const pgRoutes = require('./pg.routes');
const floorRoutes = require('./floor.routes');
const roomRoutes = require('./room.routes');
const bedRoutes = require('./bed.routes');
const bedAllocationRoutes = require('./bedAllocation.routes');
const residentRoutes = require('./resident.routes');
const residentDocumentRoutes = require('./residentDocument.routes');

router.use('/auth', authRoutes);
router.use('/pg', pgRoutes);
router.use('/', floorRoutes);
router.use('/', roomRoutes);
router.use('/', bedRoutes);
router.use('/', bedAllocationRoutes);
router.use('/', residentRoutes);
router.use('/', residentDocumentRoutes);

module.exports = router;
