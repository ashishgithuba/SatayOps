const bcrypt = require('bcryptjs');
const { Resident, ResidentDocument, User, BedAllocation, Bed, Room, Floor, PG } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

const maskDocumentNumber = (docNumber) => {
  if (!docNumber) return docNumber;
  const str = String(docNumber).trim();
  if (str.length <= 4) return str;
  const visible = str.slice(-4);
  const masked = '*'.repeat(str.length - 4);
  return `${masked}${visible}`;
};

const createResident = async (residentData, ownerId, files) => {
  const full_name = residentData.full_name || residentData.name;
  const phone = residentData.phone;
  const email = residentData.email;
  const gender = residentData.gender;
  const date_of_birth = residentData.date_of_birth;
  const father_name = residentData.father_name || residentData.guardian_name;
  const father_occupation = residentData.father_occupation;
  const occupation = residentData.occupation;
  const company_or_college = residentData.company_or_college;
  const address = residentData.address;
  const city = residentData.city;
  const state = residentData.state;
  const pincode = residentData.pincode;
  const emergency_contact_name = residentData.emergency_contact_name || residentData.guardian_name;
  const emergency_contact_phone = residentData.emergency_contact_phone || residentData.emergency_contact;
  const profile_photo_url = residentData.profile_photo_url;
  const status = residentData.status;
  const create_login_account = residentData.create_login_account;

  const existingResident = await Resident.findOne({
    where: { owner_id: ownerId, phone },
  });

  if (existingResident) {
    throw new ApiError(400, `Resident with phone '${phone}' already exists under your account`);
  }

  let finalProfileUrl = profile_photo_url || null;
  let docFile = null;

  if (files) {
    if (files.profile_photo && Array.isArray(files.profile_photo)) {
      finalProfileUrl = `/uploads/profiles/${files.profile_photo[0].filename}`;
    } else if (files.filename && files.fieldname === 'profile_photo') {
      finalProfileUrl = `/uploads/profiles/${files.filename}`;
    }

    if (files.document_file && Array.isArray(files.document_file)) {
      docFile = files.document_file[0];
    } else if (files.file && Array.isArray(files.file)) {
      docFile = files.file[0];
    } else if (files.filename && (files.fieldname === 'document_file' || files.fieldname === 'file')) {
      docFile = files;
    }
  }

  let createdUserId = null;

  if (email || create_login_account) {
    const targetEmail = email || `${phone}@stayops.local`;
    let userAccount = await User.findOne({ where: { email: targetEmail } });

    if (!userAccount) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('temporary123', salt);

      userAccount = await User.create({
        name: full_name,
        email: targetEmail,
        phone,
        password_hash,
        role: ROLES.RESIDENT || 'RESIDENT',
        status: 'ACTIVE',
        profile_image: finalProfileUrl,
      });
    }

    createdUserId = userAccount.id;
  }

  const resident = await Resident.create({
    owner_id: ownerId,
    user_id: createdUserId,
    full_name,
    phone,
    email: email || null,
    gender: gender || null,
    date_of_birth: date_of_birth || null,
    father_name: father_name || null,
    father_occupation: father_occupation || null,
    occupation: occupation || null,
    company_or_college: company_or_college || null,
    address: address || null,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    emergency_contact_name: emergency_contact_name || null,
    emergency_contact_phone: emergency_contact_phone || null,
    profile_photo_url: finalProfileUrl,
    status: status || 'INACTIVE',
  });

  // Create ResidentDocument if document details or file provided
  const docType = residentData.document_type;
  const docNum = residentData.document_number;
  if (docType || docNum || docFile) {
    const finalDocUrl = docFile ? `/uploads/documents/${docFile.filename}` : null;
    await ResidentDocument.create({
      resident_id: resident.id,
      document_type: docType || 'OTHER',
      document_number: docNum || null,
      document_url: finalDocUrl,
      verified: false,
    });
  }

  return resident;
};

const getResidentsByOwner = async (ownerId, options = {}) => {
  const page = parseInt(options.page, 10);
  const limit = parseInt(options.limit, 10);
  const isPaginated = !isNaN(page) && !isNaN(limit) && limit > 0;

  const queryOptions = {
    where: { owner_id: ownerId },
    include: [
      {
        model: ResidentDocument,
        as: 'documents',
      },
      {
        model: BedAllocation,
        as: 'allocations',
        where: { status: 'ACTIVE' },
        required: false,
        include: [
          { model: Bed, as: 'bed', attributes: ['id', 'bed_number', 'status'] },
          { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
          { model: PG, as: 'pg', attributes: ['id', 'name'] },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
    distinct: true,
  };

  if (isPaginated) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const { count, rows } = await Resident.findAndCountAll(queryOptions);

  const formattedRows = rows.map((r) => {
    const resItem = r.toJSON();
    if (resItem.documents && Array.isArray(resItem.documents)) {
      resItem.documents = resItem.documents.map((doc) => ({
        ...doc,
        document_number: maskDocumentNumber(doc.document_number),
      }));
    }
    resItem.current_allocation = resItem.allocations && resItem.allocations.length > 0 ? resItem.allocations[0] : null;
    delete resItem.allocations;
    return resItem;
  });

  return {
    rows: formattedRows,
    pagination: {
      total: count,
      page: isPaginated ? page : 1,
      limit: isPaginated ? limit : count || 10,
      totalPages: isPaginated ? Math.ceil(count / limit) || 1 : 1,
    },
  };
};

const getResidentById = async (id, ownerId) => {
  const resident = await Resident.findOne({
    where: { id, owner_id: ownerId },
    include: [
      {
        model: User,
        as: 'loginUser',
        attributes: ['id', 'email', 'role', 'status'],
      },
      {
        model: ResidentDocument,
        as: 'documents',
      },
      {
        model: BedAllocation,
        as: 'allocations',
        include: [
          { model: Bed, as: 'bed', attributes: ['id', 'bed_number', 'status'] },
          { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
          { model: PG, as: 'pg', attributes: ['id', 'name'] },
        ],
      },
    ],
  });

  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  const resItem = resident.toJSON();

  // Mask sensitive document numbers
  if (resItem.documents && Array.isArray(resItem.documents)) {
    resItem.documents = resItem.documents.map((doc) => ({
      ...doc,
      document_number: maskDocumentNumber(doc.document_number),
    }));
  }

  // Find active allocation for current_allocation key
  const activeAlloc = resItem.allocations
    ? resItem.allocations.find((alloc) => alloc.status === 'ACTIVE')
    : null;

  resItem.current_allocation = activeAlloc || null;

  return resItem;
};

const updateResident = async (id, ownerId, updateData, files) => {
  const resident = await Resident.findOne({ where: { id, owner_id: ownerId } });

  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  if (files) {
    if (files.profile_photo && Array.isArray(files.profile_photo)) {
      resident.profile_photo_url = `/uploads/profiles/${files.profile_photo[0].filename}`;
    } else if (files.filename && files.fieldname === 'profile_photo') {
      resident.profile_photo_url = `/uploads/profiles/${files.filename}`;
    }
  }

  const {
    full_name,
    phone,
    email,
    gender,
    date_of_birth,
    father_name,
    father_occupation,
    occupation,
    company_or_college,
    address,
    city,
    state,
    pincode,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo_url,
    status,
  } = updateData;

  if (phone && phone !== resident.phone) {
    const existingPhone = await Resident.findOne({
      where: { owner_id: ownerId, phone },
    });
    if (existingPhone) {
      throw new ApiError(400, `Resident with phone '${phone}' already exists under your account`);
    }
    // Also check User table for global conflict
    if (resident.user_id) {
      const existingUserPhone = await User.findOne({ where: { phone } });
      if (existingUserPhone && existingUserPhone.id !== resident.user_id) {
        throw new ApiError(400, `This phone number is already registered to another account in the system.`);
      }
    }
    resident.phone = phone;
  }

  if (email && email !== resident.email && resident.user_id) {
    const existingUserEmail = await User.findOne({ where: { email } });
    if (existingUserEmail && existingUserEmail.id !== resident.user_id) {
      throw new ApiError(400, `This email is already registered to another account in the system.`);
    }
  }

  if (full_name) resident.full_name = full_name;
  if (email !== undefined) resident.email = email;
  if (gender !== undefined) resident.gender = gender;
  if (date_of_birth !== undefined) resident.date_of_birth = date_of_birth;
  if (father_name !== undefined) resident.father_name = father_name;
  if (father_occupation !== undefined) resident.father_occupation = father_occupation;
  if (occupation !== undefined) resident.occupation = occupation;
  if (company_or_college !== undefined) resident.company_or_college = company_or_college;
  if (address !== undefined) resident.address = address;
  if (city !== undefined) resident.city = city;
  if (state !== undefined) resident.state = state;
  if (pincode !== undefined) resident.pincode = pincode;
  if (emergency_contact_name !== undefined) resident.emergency_contact_name = emergency_contact_name;
  if (emergency_contact_phone !== undefined) resident.emergency_contact_phone = emergency_contact_phone;
  // Note: profileFile check removed to avoid undefined variable error, we use files check above
  if (profile_photo_url !== undefined) resident.profile_photo_url = profile_photo_url;
  if (status) resident.status = status;

  await resident.save();

  // Sync with User table if a user account exists
  if (resident.user_id) {
    const user = await User.findByPk(resident.user_id);
    if (user) {
      let userUpdated = false;
      if (email !== undefined && user.email !== email) {
        user.email = email;
        userUpdated = true;
      }
      if (phone !== undefined && user.phone !== phone) {
        user.phone = phone;
        userUpdated = true;
      }
      if (full_name !== undefined && user.name !== full_name) {
        user.name = full_name;
        userUpdated = true;
      }
      if (resident.profile_photo_url && user.profile_image !== resident.profile_photo_url) {
        user.profile_image = resident.profile_photo_url;
        userUpdated = true;
      }
      if (status !== undefined && user.status !== status) {
        user.status = status;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
      }
    }
  }

  return resident;
};

const deleteResident = async (id, ownerId) => {
  const resident = await Resident.findOne({ where: { id, owner_id: ownerId } });

  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  await resident.destroy();
  return { id };
};

module.exports = {
  createResident,
  getResidentsByOwner,
  getResidentById,
  updateResident,
  deleteResident,
};
