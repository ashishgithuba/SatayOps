const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const allocService = require('../services/bedAllocation.service');

// Allocate Bed (POST /allocations)
const allocateBed = asyncHandler(async (req, res) => {
  const allocation = await allocService.allocateBed(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, allocation, 'Bed allocated to resident successfully'));
});

// Get All Allocations (GET /allocations)
const getAllocations = asyncHandler(async (req, res) => {
  const allocations = await allocService.getAllocations(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, allocations, 'Bed allocations fetched successfully'));
});

// Get Single Allocation (GET /allocations/:id)
const getAllocationById = asyncHandler(async (req, res) => {
  const allocation = await allocService.getAllocationById(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, allocation, 'Allocation details fetched successfully'));
});

// Checkout (POST /allocations/:id/checkout)
const checkoutAllocation = asyncHandler(async (req, res) => {
  const allocation = await allocService.checkoutAllocation(req.params.id, req.body, req.user.id);
  res.status(200).json(new ApiResponse(200, allocation, 'Resident checked out successfully and bed freed'));
});

// Transfer Bed (POST /allocations/:id/transfer)
const transferBed = asyncHandler(async (req, res) => {
  const newAllocation = await allocService.transferBed(req.params.id, req.body, req.user.id);
  res.status(200).json(new ApiResponse(200, newAllocation, 'Bed transferred successfully'));
});

// Get Resident Allocations History (GET /residents/:id/allocations)
const getResidentAllocations = asyncHandler(async (req, res) => {
  const allocations = await allocService.getResidentAllocations(req.params.id);
  res.status(200).json(new ApiResponse(200, allocations, 'Resident allocation history fetched successfully'));
});

// Get Resident Current Stay (GET /residents/:id/current-allocation)
const getResidentCurrentAllocation = asyncHandler(async (req, res) => {
  const currentAlloc = await allocService.getResidentCurrentAllocation(req.params.id);
  res.status(200).json(new ApiResponse(200, currentAlloc, 'Resident current active stay fetched successfully'));
});

module.exports = {
  allocateBed,
  getAllocations,
  getAllocationById,
  checkoutAllocation,
  transferBed,
  getResidentAllocations,
  getResidentCurrentAllocation,
};
