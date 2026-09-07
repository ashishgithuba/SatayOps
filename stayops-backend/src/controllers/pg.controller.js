const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const pgService = require('../services/pg.service');

const createPG = asyncHandler(async (req, res) => {
  const pg = await pgService.createPG(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, pg, 'PG created successfully'));
});

const getAllPGs = asyncHandler(async (req, res) => {
  const result = await pgService.getAllPGs(req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'PGs fetched successfully', result.pagination));
});

const getMyPGs = asyncHandler(async (req, res) => {
  const result = await pgService.getPGsByOwner(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'Owner PGs fetched successfully', result.pagination));
});

const getPGById = asyncHandler(async (req, res) => {
  const pg = await pgService.getPGById(req.params.id);
  res.status(200).json(new ApiResponse(200, pg, 'PG details fetched successfully'));
});

module.exports = {
  createPG,
  getAllPGs,
  getMyPGs,
  getPGById,
};
