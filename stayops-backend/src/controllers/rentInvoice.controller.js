const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const rentInvoiceService = require('../services/rentInvoice.service');

const generateInvoices = asyncHandler(async (req, res) => {
  const result = await rentInvoiceService.generateInvoicesForMonth(req.user.id, req.body.billing_month);
  res.status(200).json(new ApiResponse(200, result, 'Invoices generated successfully'));
});

const { Resident } = require('../models');

const getInvoices = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident) {
      return res.status(404).json(new ApiResponse(404, null, 'Resident profile not found'));
    }
    query.resident_id = resident.id; // Force filter
  }

  const invoices = await rentInvoiceService.getInvoices(req.user.id, query);
  res.status(200).json(new ApiResponse(200, invoices, 'Invoices fetched successfully'));
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await rentInvoiceService.getInvoiceById(req.params.id);
  
  if (req.user.role === 'RESIDENT') {
    const resident = await Resident.findOne({ where: { user_id: req.user.id } });
    if (!resident || invoice.resident_id !== resident.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
    }
  }

  res.status(200).json(new ApiResponse(200, invoice, 'Invoice fetched successfully'));
});

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await rentInvoiceService.createInvoice(req.body);
  res.status(201).json(new ApiResponse(201, invoice, 'Invoice created successfully'));
});

module.exports = {
  generateInvoices,
  getInvoices,
  getInvoiceById,
  createInvoice,
};
