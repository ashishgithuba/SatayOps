const { Payment, RentInvoice, Resident } = require('../models');
const ApiError = require('../utils/ApiError');
const { sequelize } = require('../config/database');

// Flow 1: Owner directly records a confirmed payment
const recordPayment = async (paymentData) => {
  const { invoice_id, amount, payment_method, transaction_reference, remarks } = paymentData;

  const invoice = await RentInvoice.findByPk(invoice_id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) throw new ApiError(400, 'Invalid payment amount');

  const transaction = await sequelize.transaction();
  try {
    const payment = await Payment.create(
      {
        invoice_id,
        resident_id: invoice.resident_id,
        amount: payAmount,
        payment_date: new Date(),
        payment_method: payment_method || 'CASH',
        transaction_reference: transaction_reference || null,
        status: 'COMPLETED',
        submitted_by: 'OWNER',
        remarks: remarks || null,
      },
      { transaction }
    );

    // Immediately update invoice
    const newAmountPaid = Number(invoice.amount_paid) + payAmount;
    invoice.amount_paid = newAmountPaid;
    invoice.status = newAmountPaid >= Number(invoice.total_amount) ? 'PAID' : 'PARTIAL';
    await invoice.save({ transaction });

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Flow 2: Owner creates a pending payment request on behalf of resident
// (Resident called/messaged saying they paid — owner logs it as PENDING_VERIFICATION)
const createPaymentRequest = async (paymentData) => {
  const { invoice_id, amount, payment_method, transaction_reference, remarks } = paymentData;

  const invoice = await RentInvoice.findByPk(invoice_id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) throw new ApiError(400, 'Invalid payment amount');

  // Create payment with PENDING_VERIFICATION — does NOT update invoice yet
  const payment = await Payment.create({
    invoice_id,
    resident_id: invoice.resident_id,
    amount: payAmount,
    payment_date: new Date(),
    payment_method: payment_method || 'UPI',
    transaction_reference: transaction_reference || null,
    status: 'PENDING_VERIFICATION',
    submitted_by: 'RESIDENT',
    remarks: remarks || null,
  });

  return payment;
};

// Flow 2: Owner approves a pending payment request
const approvePaymentRequest = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new ApiError(404, 'Payment request not found');
  if (payment.status !== 'PENDING_VERIFICATION') {
    throw new ApiError(400, `Payment is already ${payment.status}`);
  }

  const invoice = await RentInvoice.findByPk(payment.invoice_id);
  if (!invoice) throw new ApiError(404, 'Associated invoice not found');

  const transaction = await sequelize.transaction();
  try {
    // Mark payment as COMPLETED
    payment.status = 'COMPLETED';
    await payment.save({ transaction });

    // Now update invoice amount
    const newAmountPaid = Number(invoice.amount_paid) + Number(payment.amount);
    invoice.amount_paid = newAmountPaid;
    invoice.status = newAmountPaid >= Number(invoice.total_amount) ? 'PAID' : 'PARTIAL';
    await invoice.save({ transaction });

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Flow 2: Owner rejects a pending payment request
const rejectPaymentRequest = async (paymentId, rejection_reason) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new ApiError(404, 'Payment request not found');
  if (payment.status !== 'PENDING_VERIFICATION') {
    throw new ApiError(400, `Payment is already ${payment.status}`);
  }

  payment.status = 'FAILED';
  payment.rejection_reason = rejection_reason || 'Rejected by owner';
  await payment.save();
  return payment;
};

// Get all payments (with optional filters)
const getPayments = async (ownerId, query = {}) => {
  const { invoice_id, resident_id, status } = query;
  const whereClause = {};
  if (invoice_id) whereClause.invoice_id = invoice_id;
  if (resident_id) whereClause.resident_id = resident_id;
  if (status) whereClause.status = status;

  return await Payment.findAll({
    where: whereClause,
    include: [
      { model: Resident, as: 'resident', attributes: ['id', 'full_name', 'phone', 'email'] },
      { model: RentInvoice, as: 'invoice', attributes: ['id', 'invoice_number', 'billing_month', 'total_amount', 'amount_paid', 'status'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

// Get only PENDING_VERIFICATION requests (for owner's approval queue)
const getPendingRequests = async (ownerId) => {
  return await Payment.findAll({
    where: { status: 'PENDING_VERIFICATION' },
    include: [
      { model: Resident, as: 'resident', attributes: ['id', 'full_name', 'phone', 'email'] },
      { model: RentInvoice, as: 'invoice', attributes: ['id', 'invoice_number', 'billing_month', 'total_amount', 'amount_paid', 'status'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

module.exports = {
  recordPayment,
  createPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPayments,
  getPendingRequests,
};
