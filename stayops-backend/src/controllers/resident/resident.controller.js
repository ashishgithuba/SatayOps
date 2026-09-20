const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const residentService = require('../../services/resident/resident.service');

// Create Resident (with optional profile_photo and document_file upload)
const createResident = asyncHandler(async (req, res) => {
  const resident = await residentService.createResident(req.body, req.user.id, req.files || req.file);
  res.status(201).json(new ApiResponse(201, resident, 'Resident created successfully'));
});

// Get All Residents
const getResidents = asyncHandler(async (req, res) => {
  const result = await residentService.getResidentsByOwner(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'Residents fetched successfully', result.pagination));
});

// Get Single Resident Detail
const getResidentById = asyncHandler(async (req, res) => {
  const resident = await residentService.getResidentById(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, resident, 'Resident details fetched successfully'));
});

// Update Resident
const updateResident = asyncHandler(async (req, res) => {
  const updatedResident = await residentService.updateResident(req.params.id, req.user.id, req.body, req.files || req.file);
  res.status(200).json(new ApiResponse(200, updatedResident, 'Resident updated successfully'));
});

// Soft Delete Resident
const deleteResident = asyncHandler(async (req, res) => {
  await residentService.deleteResident(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'Resident deleted (soft-delete) successfully'));
});

module.exports = {
  createResident,
  getResidents,
  getResidentById,
  updateResident,
  deleteResident,
};
