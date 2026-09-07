const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

// 1. Create Super Admin (Public)
const createSuperAdmin = asyncHandler(async (req, res) => {
  const result = await authService.createSuperAdminUser(req.body);
  res.status(201).json(new ApiResponse(201, result, 'Super Admin created successfully'));
});

// 2. Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

// 3. Create PG Owner (Super Admin Only)
const createOwner = asyncHandler(async (req, res) => {
  const result = await authService.createOwnerBySuperAdmin(req.body);
  res.status(201).json(new ApiResponse(201, result, 'PG Owner created successfully by Super Admin'));
});

// 4. Profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedUser, 'User profile updated successfully'));
});

module.exports = {
  createSuperAdmin,
  login,
  createOwner,
  getProfile,
  updateProfile,
};
