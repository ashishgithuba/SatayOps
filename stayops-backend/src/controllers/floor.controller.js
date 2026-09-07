const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const floorService = require('../services/floor.service');

// Create Floor
const createFloor = asyncHandler(async (req, res) => {
  const floor = await floorService.createFloor(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, floor, 'Floor created successfully'));
});

// Get All Floors for Logged In Owner's PG or Specified PG
const getFloors = asyncHandler(async (req, res) => {
  const pgId = req.params.pgId || req.query.pg_id;
  const result = await floorService.getFloorsByOwnerOrPg(req.user.id, pgId, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'Floors fetched successfully', result.pagination));
});

// Get Single Floor
const getFloorById = asyncHandler(async (req, res) => {
  const floor = await floorService.getFloorById(req.params.id);
  res.status(200).json(new ApiResponse(200, floor, 'Floor detail fetched successfully'));
});

// Update Floor (PATCH)
const updateFloor = asyncHandler(async (req, res) => {
  const updatedFloor = await floorService.updateFloor(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedFloor, 'Floor updated successfully'));
});

// Delete Floor
const deleteFloor = asyncHandler(async (req, res) => {
  await floorService.deleteFloor(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Floor deleted successfully'));
});

module.exports = {
  createFloor,
  getFloors,
  getFloorById,
  updateFloor,
  deleteFloor,
};
