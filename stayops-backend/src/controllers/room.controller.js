const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const roomService = require('../services/room.service');

// Create Room
const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, room, 'Room created successfully'));
});

// Get All Rooms of a PG
const getRoomsByPg = asyncHandler(async (req, res) => {
  const pgId = req.params.pgId || req.query.pg_id;
  const result = await roomService.getRoomsByPg(req.user.id, pgId, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'PG rooms fetched successfully', result.pagination));
});

// Get All Rooms of a Specific Floor
const getRoomsByFloor = asyncHandler(async (req, res) => {
  const { floorId } = req.params;
  const result = await roomService.getRoomsByFloor(floorId, req.query);
  res.status(200).json(new ApiResponse(200, result.rows, 'Floor rooms fetched successfully', result.pagination));
});

// Get Single Room Detail
const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  res.status(200).json(new ApiResponse(200, room, 'Room detail fetched successfully'));
});

// Update Room
const updateRoom = asyncHandler(async (req, res) => {
  const updatedRoom = await roomService.updateRoom(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedRoom, 'Room updated successfully'));
});

// Change Room Status (ACTIVE / INACTIVE / MAINTENANCE)
const changeRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updatedRoom = await roomService.changeRoomStatus(req.params.id, status);
  res.status(200).json(new ApiResponse(200, updatedRoom, `Room status changed to ${status}`));
});

// Soft Delete Room
const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Room deleted (soft-delete) successfully'));
});

module.exports = {
  createRoom,
  getRoomsByPg,
  getRoomsByFloor,
  getRoomById,
  updateRoom,
  changeRoomStatus,
  deleteRoom,
};
