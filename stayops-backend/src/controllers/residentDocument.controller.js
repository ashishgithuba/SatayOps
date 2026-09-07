const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const docService = require('../services/residentDocument.service');

// Create Document (passes req.files to service)
const createDocument = asyncHandler(async (req, res) => {
  const document = await docService.createDocument(req.body, req.files);
  res.status(201).json(new ApiResponse(201, document, 'Resident document / photo uploaded successfully'));
});

// Get All Documents of a Resident
const getDocumentsByResident = asyncHandler(async (req, res) => {
  const { residentId } = req.params;
  const documents = await docService.getDocumentsByResident(residentId);
  res.status(200).json(new ApiResponse(200, documents, 'Resident documents fetched successfully'));
});

// Get Single Document Detail
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await docService.getDocumentById(req.params.id);
  res.status(200).json(new ApiResponse(200, document, 'Document details fetched successfully'));
});

// Update Document
const updateDocument = asyncHandler(async (req, res) => {
  const updatedDocument = await docService.updateDocument(req.params.id, req.body, req.files);
  res.status(200).json(new ApiResponse(200, updatedDocument, 'Document updated successfully'));
});

// Verify / Unverify Document
const verifyDocument = asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const verifiedDoc = await docService.verifyDocument(req.params.id, req.user.id, verified);
  const statusMsg = verified ? 'verified' : 'unverified';
  res.status(200).json(new ApiResponse(200, verifiedDoc, `Document marked as ${statusMsg} successfully`));
});

// Delete Document
const deleteDocument = asyncHandler(async (req, res) => {
  await docService.deleteDocument(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Resident document deleted successfully'));
});

module.exports = {
  createDocument,
  getDocumentsByResident,
  getDocumentById,
  updateDocument,
  verifyDocument,
  deleteDocument,
};
