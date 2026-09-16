const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/notice.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const { ROLES } = require('../constants/roles');

router.use(protect);

// Notice Management (Owners only)
router.post('/notices', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), noticeController.createNotice);
router.patch('/notices/:id/status', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), noticeController.updateNoticeStatus);
router.delete('/notices/:id', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN), noticeController.deleteNotice);

// View Notices (Accessible by both Owner and Resident)
router.get('/notices', authorize(ROLES.OWNER, 'PG_OWNER', ROLES.SUPER_ADMIN, ROLES.RESIDENT), noticeController.getNotices);

module.exports = router;
