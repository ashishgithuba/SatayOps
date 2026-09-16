const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const noticeService = require('../services/notice.service');

const createNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.createNotice(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, notice, 'Notice created successfully'));
});

const { Resident } = require('../models');

const getNotices = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) return res.status(404).json(new ApiResponse(404, null, 'Resident not found'));
    query.resident_id = resident.id;
  }
  
  const notices = await noticeService.getNotices(query);
  res.status(200).json(new ApiResponse(200, notices, 'Notices fetched successfully'));
});

const updateNoticeStatus = asyncHandler(async (req, res) => {
  const notice = await noticeService.updateNoticeStatus(req.params.id, req.body.status, req.body.target_ids, req.user.id);
  res.status(200).json(new ApiResponse(200, notice, 'Notice status updated'));
});

const deleteNotice = asyncHandler(async (req, res) => {
  await noticeService.deleteNotice(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Notice deleted successfully'));
});

module.exports = {
  createNotice,
  getNotices,
  updateNoticeStatus,
  deleteNotice,
};
