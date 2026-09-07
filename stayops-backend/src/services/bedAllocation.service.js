const { BedAllocation, Bed, Room, Resident, PG } = require('../models');
const ApiError = require('../utils/ApiError');
const { sequelize } = require('../config/database');

// Allocate Bed
const allocateBed = async (allocationData, ownerId) => {
  const {
    resident_id,
    bed_id,
    check_in_date,
    check_out_date,
    monthly_rent,
    security_deposit,
    notes,
  } = allocationData;

  const resident = await Resident.findOne({ where: { id: resident_id, owner_id: ownerId } });
  if (!resident) {
    throw new ApiError(404, 'Resident not found under your account');
  }

  // Check if resident already has an ACTIVE allocation
  const activeResidentAlloc = await BedAllocation.findOne({
    where: { resident_id, status: 'ACTIVE' },
  });
  if (activeResidentAlloc) {
    throw new ApiError(400, 'Resident already has an active bed allocation');
  }

  const bed = await Bed.findByPk(bed_id, {
    include: [{ model: Room, as: 'room' }],
  });
  if (!bed) {
    throw new ApiError(404, 'Bed not found');
  }

  if (bed.status !== 'AVAILABLE') {
    throw new ApiError(400, `Bed is not AVAILABLE (Current status: ${bed.status})`);
  }

  const targetRoomId = bed.room_id;
  const targetPgId = bed.pg_id;

  const transaction = await sequelize.transaction();

  try {
    const allocation = await BedAllocation.create(
      {
        resident_id,
        pg_id: targetPgId,
        room_id: targetRoomId,
        bed_id,
        check_in_date,
        check_out_date: check_out_date || null,
        monthly_rent,
        security_deposit: security_deposit || 0,
        status: 'ACTIVE',
        notes: notes || null,
      },
      { transaction }
    );

    // Update Bed Status to OCCUPIED
    bed.status = 'OCCUPIED';
    await bed.save({ transaction });

    // Update Resident Status to ACTIVE
    resident.status = 'ACTIVE';
    await resident.save({ transaction });

    await transaction.commit();
    return allocation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Get All Allocations of PG Owner
const getAllocations = async (ownerId, query = {}) => {
  const { status, resident_id, pg_id } = query;
  const whereClause = {};

  if (status) whereClause.status = status;
  if (resident_id) whereClause.resident_id = resident_id;

  let targetPgId = pg_id;
  if (!targetPgId && !resident_id) {
    const ownerPg = await PG.findOne({ where: { owner_id: ownerId } });
    if (ownerPg) targetPgId = ownerPg.id;
  }
  if (targetPgId) whereClause.pg_id = targetPgId;

  return await BedAllocation.findAll({
    where: whereClause,
    include: [
      { model: Resident, as: 'resident', attributes: ['id', 'full_name', 'phone', 'email', 'profile_photo_url'] },
      { model: Bed, as: 'bed', attributes: ['id', 'bed_number', 'status'] },
      { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
      { model: PG, as: 'pg', attributes: ['id', 'name'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

// Get Single Allocation Detail by ID
const getAllocationById = async (id, ownerId) => {
  const allocation = await BedAllocation.findByPk(id, {
    include: [
      { model: Resident, as: 'resident' },
      { model: Bed, as: 'bed' },
      { model: Room, as: 'room' },
      { model: PG, as: 'pg' },
    ],
  });

  if (!allocation) {
    throw new ApiError(404, 'Bed allocation record not found');
  }

  return allocation;
};

// Checkout Resident Bed (Supports bed_status: 'AVAILABLE' or 'MAINTENANCE', default: 'AVAILABLE')
const checkoutAllocation = async (id, checkoutData, ownerId) => {
  const { check_out_date, notes, bed_status } = checkoutData;

  const allocation = await BedAllocation.findByPk(id);
  if (!allocation) {
    throw new ApiError(404, 'Bed allocation record not found');
  }

  if (allocation.status !== 'ACTIVE') {
    throw new ApiError(400, `Allocation is already ${allocation.status}`);
  }

  // Target status for bed after checkout (Default AVAILABLE unless specified MAINTENANCE)
  const targetBedStatus = bed_status && ['AVAILABLE', 'MAINTENANCE'].includes(bed_status) ? bed_status : 'AVAILABLE';

  const transaction = await sequelize.transaction();

  try {
    allocation.status = 'COMPLETED';
    allocation.check_out_date = check_out_date || new Date();
    if (notes) allocation.notes = notes;
    await allocation.save({ transaction });

    // Set Bed Status to AVAILABLE or MAINTENANCE
    const bed = await Bed.findByPk(allocation.bed_id);
    if (bed) {
      bed.status = targetBedStatus;
      await bed.save({ transaction });
    }

    // Mark Resident Status INACTIVE
    const resident = await Resident.findByPk(allocation.resident_id);
    if (resident) {
      resident.status = 'INACTIVE';
      await resident.save({ transaction });
    }

    await transaction.commit();
    return allocation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Transfer Resident to New Bed
const transferBed = async (id, transferData, ownerId) => {
  const { new_bed_id, transfer_date, new_monthly_rent, notes, old_bed_status } = transferData;

  const currentAlloc = await BedAllocation.findByPk(id);
  if (!currentAlloc || currentAlloc.status !== 'ACTIVE') {
    throw new ApiError(404, 'Active bed allocation record not found for transfer');
  }

  const newBed = await Bed.findByPk(new_bed_id);
  if (!newBed) {
    throw new ApiError(404, 'New target bed not found');
  }

  if (newBed.status !== 'AVAILABLE') {
    throw new ApiError(400, `New bed is not AVAILABLE (Status: ${newBed.status})`);
  }

  const effTransferDate = transfer_date || new Date().toISOString().split('T')[0];
  const targetOldBedStatus = old_bed_status && ['AVAILABLE', 'MAINTENANCE'].includes(old_bed_status) ? old_bed_status : 'AVAILABLE';

  const transaction = await sequelize.transaction();

  try {
    // 1. Complete current allocation
    currentAlloc.status = 'COMPLETED';
    currentAlloc.check_out_date = effTransferDate;
    if (notes) currentAlloc.notes = `Transferred to Bed ${newBed.bed_number}. ${notes}`;
    await currentAlloc.save({ transaction });

    // 2. Set old bed status
    const oldBed = await Bed.findByPk(currentAlloc.bed_id);
    if (oldBed) {
      oldBed.status = targetOldBedStatus;
      await oldBed.save({ transaction });
    }

    // 3. Create new allocation for new bed
    const newAllocation = await BedAllocation.create(
      {
        resident_id: currentAlloc.resident_id,
        pg_id: newBed.pg_id,
        room_id: newBed.room_id,
        bed_id: new_bed_id,
        check_in_date: effTransferDate,
        monthly_rent: new_monthly_rent !== undefined ? new_monthly_rent : currentAlloc.monthly_rent,
        security_deposit: currentAlloc.security_deposit,
        status: 'ACTIVE',
        notes: `Transferred from previous allocation ${currentAlloc.id}`,
      },
      { transaction }
    );

    // 4. Mark new bed OCCUPIED
    newBed.status = 'OCCUPIED';
    await newBed.save({ transaction });

    await transaction.commit();
    return newAllocation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Get Resident Allocations History
const getResidentAllocations = async (resident_id) => {
  const resident = await Resident.findByPk(resident_id);
  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  return await BedAllocation.findAll({
    where: { resident_id },
    include: [
      { model: Bed, as: 'bed' },
      { model: Room, as: 'room' },
      { model: PG, as: 'pg' },
    ],
    order: [['created_at', 'DESC']],
  });
};

// Get Resident Current Active Allocation
const getResidentCurrentAllocation = async (resident_id) => {
  const resident = await Resident.findByPk(resident_id);
  if (!resident) {
    throw new ApiError(404, 'Resident not found');
  }

  const currentAlloc = await BedAllocation.findOne({
    where: { resident_id, status: 'ACTIVE' },
    include: [
      { model: Bed, as: 'bed' },
      { model: Room, as: 'room' },
      { model: PG, as: 'pg' },
    ],
  });

  if (!currentAlloc) {
    throw new ApiError(404, 'No active bed allocation found for this resident');
  }

  return currentAlloc;
};

module.exports = {
  allocateBed,
  getAllocations,
  getAllocationById,
  checkoutAllocation,
  transferBed,
  getResidentAllocations,
  getResidentCurrentAllocation,
};
