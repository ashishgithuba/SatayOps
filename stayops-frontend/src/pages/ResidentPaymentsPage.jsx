import React, { useState, useEffect } from 'react';
import { invoiceService, paymentService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import { Receipt, CreditCard, Upload, CheckCircle, Clock, FileText, X, AlertCircle } from 'lucide-react';

export default function ResidentPaymentsPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'UPI',
    reference_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      if (!user?.id) return;
      const [invRes, payRes] = await Promise.all([
        invoiceService.getInvoices({ resident_id: user.id }),
        paymentService.getPayments({ resident_id: user.id })
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error('Failed to load payment data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePayClick = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.amount,
      payment_method: 'UPI',
      reference_number: ''
    });
    setShowPayModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await paymentService.createPaymentRequest({
        invoice_id: selectedInvoice.id,
        amount: Number(paymentData.amount),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number
      });
      setMsg({ text: 'Payment request submitted for approval.', type: 'success' });
      setShowPayModal(false);
      fetchData();
    } catch (err) {
      setMsg({ text: err.message || 'Failed to submit payment request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading payments...</div>;

  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'PARTIAL');
  const pastInvoices = invoices.filter(inv => inv.status === 'PAID');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>My Payments</h1>
        <p style={{ color: '#64748b' }}>Manage your rent dues and payment history.</p>
      </div>

      {msg.text && (
        <div style={{ background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
          {msg.text}
        </div>
      )}

      {/* Pending Dues Section */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={20} color="#f59e0b" /> Pending Dues
      </h2>
      
      {pendingInvoices.length === 0 ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#10b981', fontWeight: '600', marginBottom: '2.5rem' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
          All caught up! No pending dues.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
          {pendingInvoices.map(invoice => (
            <div key={invoice.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.2rem' }}>{invoice.title || 'Rent Invoice'}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626' }}>₹{invoice.amount}</div>
              </div>
              <button 
                onClick={() => handlePayClick(invoice)}
                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <CreditCard size={18} /> Pay Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment History Section */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={20} color="#64748b" /> Payment History
      </h2>
      
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {payments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No past payments found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Method</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Ref Number</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#0f172a' }}>{new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '700' }}>₹{payment.amount}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>{payment.payment_method}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>{payment.reference_number || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: payment.status === 'APPROVED' ? '#dcfce7' : payment.status === 'PENDING' ? '#fef3c7' : '#fee2e2', 
                      color: payment.status === 'APPROVED' ? '#15803d' : payment.status === 'PENDING' ? '#b45309' : '#b91c1c', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '700' 
                    }}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-pop-in" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Submit Payment Details</h3>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Paying for: {selectedInvoice.title}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>₹{selectedInvoice.amount}</div>
            </div>

            <form onSubmit={handleSubmitPayment} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Amount Paid</label>
                <input required type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Payment Method</label>
                <select required value={paymentData.payment_method} onChange={e => setPaymentData({...paymentData, payment_method: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Transaction ID / Reference No.</label>
                <input required type="text" value={paymentData.reference_number} onChange={e => setPaymentData({...paymentData, reference_number: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </div>

              <button disabled={submitting} type="submit" style={{ width: '100%', padding: '0.85rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', marginTop: '0.5rem', cursor: 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
