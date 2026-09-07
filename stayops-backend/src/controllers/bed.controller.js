const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const bedService = require('../services/bed.service');

// Create Bed
const createBed = asyncHandler(async (req, res) => {
  const bed = await bedService.createBed(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, bed, 'Bed created successfully'));
});

// Get All Beds (supports ?room_id=... & ?floor_id=... & ?pg_id=... & ?status=... & ?page=... & ?limit=...)
const getBeds = asyncHandler(async (req, res) => {
  const result = await bedService.getBeds(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'Beds fetched successfully', result.pagination));
});

// Get Single Bed Detail by ID
const getBedById = asyncHandler(async (req, res) => {
  const bed = await bedService.getBedById(req.params.id);
  res.status(200).json(new ApiResponse(200, bed, 'Bed details fetched successfully'));
});

// Update Bed
const updateBed = asyncHandler(async (req, res) => {
  const updatedBed = await bedService.updateBed(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedBed, 'Bed updated successfully'));
});

// Delete Bed (Soft Delete)
const deleteBed = asyncHandler(async (req, res) => {
  await bedService.deleteBed(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Bed deleted successfully'));
});

module.exports = {
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
};
