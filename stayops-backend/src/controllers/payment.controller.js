const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const paymentService = require('../services/payment.service');

// Flow 1: Owner directly confirms payment received
const recordPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.recordPayment(req.body);
  res.status(201).json(new ApiResponse(201, payment, 'Payment recorded successfully'));
});

const { Resident } = require('../models');

// Flow 2: Create a pending payment request (resident claimed to pay)
const createPaymentRequest = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) return res.status(404).json(new ApiResponse(404, null, 'Resident not found'));
    payload.resident_id = resident.id; // Force resident ID from token
  }

  const payment = await paymentService.createPaymentRequest(payload);
  res.status(201).json(new ApiResponse(201, payment, 'Payment request logged. Pending verification.'));
});

// Flow 2: Owner approves a pending payment request
const approvePaymentRequest = asyncHandler(async (req, res) => {
  const payment = await paymentService.approvePaymentRequest(req.params.id);
  res.status(200).json(new ApiResponse(200, payment, 'Payment approved and invoice updated'));
});

// Flow 2: Owner rejects a pending payment request
const rejectPaymentRequest = asyncHandler(async (req, res) => {
  const payment = await paymentService.rejectPaymentRequest(req.params.id, req.body.rejection_reason);
  res.status(200).json(new ApiResponse(200, payment, 'Payment request rejected'));
});

// Get all payments (history)
const getPayments = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) return res.status(404).json(new ApiResponse(404, null, 'Resident not found'));
    query.resident_id = resident.id; // Force filter
  }

  const payments = await paymentService.getPayments(req.user.id, query);
  res.status(200).json(new ApiResponse(200, payments, 'Payments fetched successfully'));
});

// Get all PENDING_VERIFICATION requests (owner's approval queue)
const getPendingRequests = asyncHandler(async (req, res) => {
  const requests = await paymentService.getPendingRequests(req.user.id);
  res.status(200).json(new ApiResponse(200, requests, 'Pending payment requests fetched'));
});

module.exports = {
  recordPayment,
  createPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPayments,
  getPendingRequests,
};
