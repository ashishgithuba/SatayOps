const { ResidentDocument, Resident, User } = require('../models');
const ApiError = require('../utils/ApiError');

// Helper to mask sensitive document numbers (e.g. "123456789012" -> "********9012")
const maskDocumentNumber = (docNumber) => {
  if (!docNumber) return docNumber;
  const str = String(docNumber).trim();
  if (str.length <= 4) return str;
  const visible = str.slice(-4);
  const masked = '*'.repeat(str.length - 4);
  return `${masked}${visible}`;
};

const createDocument = async (docData, files) => {
  const { resident_id, document_type, document_number, document_url } = docData;

  const resident = await Resident.findByPk(resident_id);
  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  // Check if profile photo uploaded
  let profilePhotoUrl = null;
  if (files && files.profile_photo && files.profile_photo[0]) {
    profilePhotoUrl = `/uploads/profiles/${files.profile_photo[0].filename}`;
    resident.profile_photo_url = profilePhotoUrl;
    await resident.save();
  }

  // Check identity document file
  let docFile = null;
  if (files) {
    if (files.file && files.file[0]) docFile = files.file[0];
    else if (files.document_file && files.document_file[0]) docFile = files.document_file[0];
  }

  let finalDocUrl = document_url;
  if (docFile) {
    finalDocUrl = `/uploads/documents/${docFile.filename}`;
  }

  if (!finalDocUrl && profilePhotoUrl) {
    return {
      message: 'Resident profile photo updated successfully',
      profile_photo_url: resident.profile_photo_url,
    };
  }

  if (!finalDocUrl) {
    throw new ApiError(400, 'Please upload a document file (image/pdf) or provide document_url');
  }

  const targetDocType = document_type || 'AADHAAR';

  //  Strict Check: Find ANY existing document for this resident_id & document_type
  let document = await ResidentDocument.findOne({
    where: {
      resident_id,
      document_type: targetDocType,
    },
    order: [['created_at', 'ASC']],
  });

  if (document) {
    // REPLACE: Update existing document record with new file & reset verification
    document.document_url = finalDocUrl;
    if (document_number !== undefined) document.document_number = document_number;
    document.verified = false;
    document.verified_at = null;
    document.verified_by = null;
    await document.save();

    // Clean up any extra duplicate rows for this (resident_id, document_type) if they existed previously
    const duplicates = await ResidentDocument.findAll({
      where: {
        resident_id,
        document_type: targetDocType,
      },
    });

    if (duplicates.length > 1) {
      for (const dup of duplicates) {
        if (dup.id !== document.id) {
          await dup.destroy();
        }
      }
    }
  } else {
    // Create brand new document record
    document = await ResidentDocument.create({
      resident_id,
      document_type: targetDocType,
      document_number: document_number || null,
      document_url: finalDocUrl,
      verified: false,
      verified_at: null,
      verified_by: null,
    });
  }

  const resultData = document.toJSON();
  resultData.document_number = maskDocumentNumber(resultData.document_number);
  resultData.resident_profile_photo_url = resident.profile_photo_url;

  return resultData;
};

// Get all documents for a resident (with masking)
const getDocumentsByResident = async (resident_id) => {
  const resident = await Resident.findByPk(resident_id);
  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  const documents = await ResidentDocument.findAll({
    where: { resident_id },
    include: [
      {
        model: User,
        as: 'verifier',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return documents.map((doc) => {
    const item = doc.toJSON();
    item.document_number = maskDocumentNumber(item.document_number);
    return item;
  });
};

// Get single document detail (with masking)
const getDocumentById = async (id) => {
  const document = await ResidentDocument.findByPk(id, {
    include: [
      {
        model: Resident,
        as: 'resident',
        attributes: ['id', 'full_name', 'phone', 'profile_photo_url'],
      },
      {
        model: User,
        as: 'verifier',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!document) {
    throw new ApiError(404, 'Resident document not found');
  }

  const item = document.toJSON();
  item.document_number = maskDocumentNumber(item.document_number);
  return item;
};

// Update document details
const updateDocument = async (id, updateData, files) => {
  const document = await ResidentDocument.findByPk(id);

  if (!document) {
    throw new ApiError(404, 'Resident document not found');
  }

  const { document_type, document_number, document_url } = updateData;

  if (document_type) document.document_type = document_type;
  if (document_number !== undefined) document.document_number = document_number;

  let docFile = null;
  if (files) {
    if (files.file && files.file[0]) docFile = files.file[0];
    else if (files.document_file && files.document_file[0]) docFile = files.document_file[0];
  }

  if (docFile || document_url) {
    document.document_url = docFile ? `/uploads/documents/${docFile.filename}` : document_url;
    document.verified = false;
    document.verified_at = null;
    document.verified_by = null;
  }

  await document.save();

  if (files && files.profile_photo && files.profile_photo[0]) {
    const resident = await Resident.findByPk(document.resident_id);
    if (resident) {
      resident.profile_photo_url = `/uploads/profiles/${files.profile_photo[0].filename}`;
      await resident.save();
    }
  }

  const item = document.toJSON();
  item.document_number = maskDocumentNumber(item.document_number);
  return item;
};

// Verify/Unverify Document
const verifyDocument = async (id, verifierUserId, verifiedState) => {
  const document = await ResidentDocument.findByPk(id);

  if (!document) {
    throw new ApiError(404, 'Resident document not found');
  }

  document.verified = verifiedState;
  document.verified_at = verifiedState ? new Date() : null;
  document.verified_by = verifiedState ? verifierUserId : null;

  await document.save();

  const item = document.toJSON();
  item.document_number = maskDocumentNumber(item.document_number);
  return item;
};

// Delete document
const deleteDocument = async (id) => {
  const document = await ResidentDocument.findByPk(id);

  if (!document) {
    throw new ApiError(404, 'Resident document not found');
  }

  await document.destroy();
  return { id };
};

module.exports = {
  createDocument,
  getDocumentsByResident,
  getDocumentById,
  updateDocument,
  verifyDocument,
  deleteDocument,
};
