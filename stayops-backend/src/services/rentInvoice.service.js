const { RentInvoice, BedAllocation, Resident, Bed, Room, PG } = require('../models');
const ApiError = require('../utils/ApiError');
const { sequelize } = require('../config/database');

// Generate invoices for active allocations for a given billing month
const generateInvoicesForMonth = async (ownerId, billingMonth) => {
  const effMonth = billingMonth || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get all active allocations belonging to owner's PGs
  const activeAllocations = await BedAllocation.findAll({
    where: { status: 'ACTIVE' },
    include: [{ model: PG, as: 'pg', where: { owner_id: ownerId } }],
  });

  const generatedInvoices = [];

  for (const alloc of activeAllocations) {
    // Check if invoice already exists for this allocation & month
    const existing = await RentInvoice.findOne({
      where: {
        allocation_id: alloc.id,
        billing_month: effMonth,
      },
    });

    if (!existing) {
      const invNum = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

      const inv = await RentInvoice.create({
        invoice_number: invNum,
        allocation_id: alloc.id,
        resident_id: alloc.resident_id,
        billing_month: effMonth,
        due_date: dueDate,
        base_rent: alloc.monthly_rent,
        electricity_charges: 0,
        maintenance_charges: 0,
        late_fees: 0,
        total_amount: alloc.monthly_rent,
        amount_paid: 0,
        status: 'UNPAID',
      });
      generatedInvoices.push(inv);
    }
  }

  return { message: `Generated ${generatedInvoices.length} invoices for ${effMonth}`, count: generatedInvoices.length, invoices: generatedInvoices };
};

// Get list of invoices
const getInvoices = async (ownerId, query = {}) => {
  const { status, resident_id, allocation_id } = query;
  const whereClause = {};

  if (status) whereClause.status = status;
  if (resident_id) whereClause.resident_id = resident_id;
  if (allocation_id) whereClause.allocation_id = allocation_id;

  return await RentInvoice.findAll({
    where: whereClause,
    include: [
      { model: Resident, as: 'resident', attributes: ['id', 'full_name', 'phone', 'email'] },
      {
        model: BedAllocation,
        as: 'allocation',
        include: [
          { model: Bed, as: 'bed', attributes: ['id', 'bed_number'] },
          { model: Room, as: 'room', attributes: ['id', 'room_number'] },
          { model: PG, as: 'pg', attributes: ['id', 'name'] },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

// Get single invoice by ID
const getInvoiceById = async (id) => {
  const invoice = await RentInvoice.findByPk(id, {
    include: [
      { model: Resident, as: 'resident' },
      { model: BedAllocation, as: 'allocation' },
    ],
  });

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  return invoice;
};

// Create custom invoice
const createInvoice = async (invoiceData) => {
  const { allocation_id, resident_id, billing_month, due_date, base_rent, electricity_charges, maintenance_charges, late_fees, notes } = invoiceData;

  const invNum = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const bRent = Number(base_rent || 0);
  const eCharges = Number(electricity_charges || 0);
  const mCharges = Number(maintenance_charges || 0);
  const lFees = Number(late_fees || 0);
  const total = bRent + eCharges + mCharges + lFees;

  const invoice = await RentInvoice.create({
    invoice_number: invNum,
    allocation_id,
    resident_id,
    billing_month: billing_month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    due_date: due_date || new Date(),
    base_rent: bRent,
    electricity_charges: eCharges,
    maintenance_charges: mCharges,
    late_fees: lFees,
    total_amount: total,
    amount_paid: 0,
    status: 'UNPAID',
    notes: notes || null,
  });

  return invoice;
};

module.exports = {
  generateInvoicesForMonth,
  getInvoices,
  getInvoiceById,
  createInvoice,
};
