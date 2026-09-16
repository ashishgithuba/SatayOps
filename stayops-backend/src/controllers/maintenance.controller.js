const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const maintenanceService = require('../services/maintenance.service');

const { Resident, BedAllocation, PG } = require('../models');

const createRequest = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) return res.status(404).json(new ApiResponse(404, null, 'Resident not found'));
    
    const allocation = await BedAllocation.findOne({ 
      where: { resident_id: resident.id, status: 'ACTIVE' } 
    });
    
    if (!allocation) {
      return res.status(400).json(new ApiResponse(400, null, 'No active allocation found. Cannot create request.'));
    }

    payload.resident_id = resident.id;
    payload.pg_id = allocation.pg_id;
    payload.bed_id = allocation.bed_id;
  }
  const request = await maintenanceService.createRequest(payload, req.user.id);
  res.status(201).json(new ApiResponse(201, request, 'Maintenance request created successfully'));
});

const getRequests = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) return res.status(404).json(new ApiResponse(404, null, 'Resident not found'));
    query.resident_id = resident.id;
  } else if (req.user.role === 'OWNER' || req.user.role === 'PG_OWNER') {
    // PG Owner should only see requests for their own PGs
    const pgs = await PG.findAll({ where: { owner_id: req.user.id } });
    const pgIds = pgs.map(pg => pg.id);
    query.pg_id = pgIds;
  }
  
  const requests = await maintenanceService.getRequests(query);
  res.status(200).json(new ApiResponse(200, requests, 'Maintenance requests fetched successfully'));
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await maintenanceService.getRequestById(req.params.id);
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident || request.resident_id !== resident.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
    }
  }

  res.status(200).json(new ApiResponse(200, request, 'Maintenance request details fetched'));
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const request = await maintenanceService.updateRequestStatus(req.params.id, req.body, req.user.id);
  res.status(200).json(new ApiResponse(200, request, 'Maintenance request status updated'));
});

const deleteRequest = asyncHandler(async (req, res) => {
  await maintenanceService.deleteRequest(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Maintenance request deleted successfully'));
});

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};
