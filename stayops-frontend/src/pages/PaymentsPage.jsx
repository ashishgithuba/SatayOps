import React, { useState, useEffect } from 'react';
import { invoiceService, paymentService } from '../services/api.service';
import {
  CreditCard, Plus, X, RefreshCw, CheckCircle2, DollarSign,
  Calendar, Search, Clock, CheckCheck, AlertCircle, ShieldCheck,
  XCircle, Bell
} from 'lucide-react';
import Pagination from '../components/Pagination';

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  color: '#060913',
  fontSize: '0.88rem',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  color: '#060913',
  fontSize: '0.85rem',
  marginBottom: '0.35rem',
  fontWeight: '600',
};

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const currentYearMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(currentYearMonthStr);
  const [mainView, setMainView] = useState('INVOICES'); // INVOICES | REQUESTS
  
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPagination, setRequestsPagination] = useState(null);

  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [directPayForm, setDirectPayForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'UPI',
    transaction_reference: '',
    remarks: '',
  });

  const [requestForm, setRequestForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'UPI',
    transaction_reference: '',
    remarks: '',
  });

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [generateMonth, setGenerateMonth] = useState(currentYearMonth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, pendingRes] = await Promise.all([
        invoiceService.getInvoices(),
        paymentService.getPendingRequests({ page: requestsPage, limit: 10 }),
      ]);
      setInvoices(invRes.data || []);
      setPendingRequests(pendingRes.data || []);
      setRequestsPagination(pendingRes.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [requestsPage]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Flow 1: Owner directly records confirmed payment
  const handleDirectPay = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await paymentService.recordPayment({
        invoice_id: directPayForm.invoice_id,
        amount: Number(directPayForm.amount),
        payment_method: directPayForm.payment_method,
        transaction_reference: directPayForm.transaction_reference || null,
        remarks: directPayForm.remarks || null,
      });
      showSuccess('✅ Payment recorded! Invoice updated to PAID/PARTIAL.');
      setShowDirectPayModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Flow 2a: Owner logs resident's payment claim as PENDING_VERIFICATION
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await paymentService.createPaymentRequest({
        invoice_id: requestForm.invoice_id,
        amount: Number(requestForm.amount),
        payment_method: requestForm.payment_method,
        transaction_reference: requestForm.transaction_reference || null,
        remarks: requestForm.remarks || null,
      });
      showSuccess('⏳ Payment request logged! It appears in the "Verify Requests" queue.');
      setShowRequestModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create payment request');
    } finally {
      setSubmitting(false);
    }
  };

  // Flow 2b: Owner approves a pending request
  const handleApprove = async (requestId) => {
    setSubmitting(true);
    try {
      await paymentService.approvePayment(requestId);
      showSuccess('✅ Payment approved! Invoice updated to PAID/PARTIAL.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to approve payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Flow 2c: Owner rejects a pending request
  const handleReject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await paymentService.rejectPayment(selectedRequest.id, rejectReason);
      showSuccess('❌ Payment request rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to reject payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const [year, monthNum] = generateMonth.split('-');
      const date = new Date(year, monthNum - 1);
      const formattedMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      await invoiceService.generateInvoices({ billing_month: formattedMonth });
      showSuccess(`📄 Bills generated for ${formattedMonth}!`);
      setSelectedMonthFilter(formattedMonth);
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to generate invoices');
    } finally {
      setSubmitting(false);
    }
  };

  const openDirectPayModal = (inv) => {
    const due = Number(inv.total_amount) - Number(inv.amount_paid);
    setSelectedInvoice(inv);
    setDirectPayForm({ invoice_id: inv.id, amount: String(due > 0 ? due : ''), payment_method: 'UPI', transaction_reference: '', remarks: '' });
    setError('');
    setShowDirectPayModal(true);
  };

  const openRequestModal = (inv) => {
    const due = Number(inv.total_amount) - Number(inv.amount_paid);
    setSelectedInvoice(inv);
    setRequestForm({ invoice_id: inv.id, amount: String(due > 0 ? due : ''), payment_method: 'UPI', transaction_reference: '', remarks: '' });
    setError('');
    setShowRequestModal(true);
  };

  const uniqueMonthsSet = new Set(invoices.map(inv => inv.billing_month).filter(Boolean));
  uniqueMonthsSet.add(selectedMonthFilter);
  const uniqueMonths = [...uniqueMonthsSet];

  const monthFilteredInvoices = invoices.filter(i => i.billing_month === selectedMonthFilter);

  const monthFilteredRequests = pendingRequests.filter(req => req.invoice?.billing_month === selectedMonthFilter);

  const filteredInvoices = monthFilteredInvoices.filter((inv) => {
    const matchesTab = activeTab === 'ALL' || inv.status === activeTab;
    const resName = (inv.resident?.full_name || '').toLowerCase();
    const resPhone = (inv.resident?.phone || '').toLowerCase();
    const roomNo = String(inv.allocation?.room?.room_number || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || resName.includes(q) || resPhone.includes(q) || roomNo.includes(q);
    return matchesTab && matchesSearch;
  });

  const invoicesLimit = 10;
  const paginatedInvoices = filteredInvoices.slice((invoicesPage - 1) * invoicesLimit, invoicesPage * invoicesLimit);
  const invoicesPaginationData = {
    currentPage: invoicesPage,
    totalPages: Math.ceil(filteredInvoices.length / invoicesLimit),
    totalItems: filteredInvoices.length,
    pageSize: invoicesLimit,
  };

  const totalBilled = monthFilteredInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalCollected = monthFilteredInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const totalPending = totalBilled - totalCollected;

  return (
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Rent Billing & Payments</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Track who paid, who is due, and verify resident payment claims.</p>
          </div>
          <div>
            <button onClick={() => setShowGenerateModal(true)} style={{ background: '#060913', color: '#ffd369', padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus size={18} /> Create New Bills
            </button>
          </div>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#065f46', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} color="#10b981" /> {successMsg}
          </div>
        )}

        {/* Filter Section for Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#060913' }}>Summary Overview:</h3>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.25rem 0.75rem' }}>
             <Calendar size={15} color="#64748b" />
             <select 
                value={selectedMonthFilter} 
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                style={{ padding: '0.4rem', border: 'none', fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', outline: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
           </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Billed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#060913', marginTop: '0.3rem' }}>₹{totalBilled.toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>{monthFilteredInvoices.length} invoices</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCheck size={14} /> Collected</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '0.3rem' }}>₹{totalCollected.toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.2rem' }}>{monthFilteredInvoices.filter(i => i.status === 'PAID').length} fully paid</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> Due / Pending</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginTop: '0.3rem' }}>₹{totalPending.toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.2rem' }}>{monthFilteredInvoices.filter(i => i.status !== 'PAID').length} unpaid</div>
          </div>
          <div style={{ background: monthFilteredRequests.length > 0 ? 'rgba(245,158,11,0.1)' : 'var(--gradient-card)', border: monthFilteredRequests.length > 0 ? '1px solid rgba(245,158,11,0.35)' : '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer' }} onClick={() => setMainView('REQUESTS')}>
            <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Bell size={14} /> Pending Verification</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: monthFilteredRequests.length > 0 ? '#d97706' : '#94a3b8', marginTop: '0.3rem' }}>{monthFilteredRequests.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.2rem' }}>Tap to review requests</div>
          </div>
        </div>

        {/* Main View Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <button onClick={() => setMainView('INVOICES')} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', border: 'none', background: mainView === 'INVOICES' ? '#060913' : 'transparent', color: mainView === 'INVOICES' ? '#ffd369' : '#475569', cursor: 'pointer' }}>
            📋 Rent Invoices
          </button>
          <button onClick={() => setMainView('REQUESTS')} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', border: 'none', background: mainView === 'REQUESTS' ? '#060913' : 'transparent', color: mainView === 'REQUESTS' ? '#ffd369' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏳ Verify Requests
            {monthFilteredRequests.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50px', padding: '0.05rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>{monthFilteredRequests.length}</span>}
          </button>
        </div>

        {/* ======================== VIEW 1: INVOICES ======================== */}
        {mainView === 'INVOICES' && (
          <>
            {/* Search + Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search by resident name, phone, room..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem 0.6rem 2.2rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#060913', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((tab) => {
                  const count = tab === 'ALL' ? monthFilteredInvoices.length : monthFilteredInvoices.filter(i => i.status === tab).length;
                  const clr = tab === 'PAID' ? '#10b981' : tab === 'PARTIAL' ? '#f59e0b' : tab === 'UNPAID' ? '#ef4444' : '#475569';
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', border: activeTab === tab ? `1.5px solid ${clr}` : '1px solid #e2e8f0', background: activeTab === tab ? (tab === 'ALL' ? '#060913' : `rgba(${tab === 'PAID' ? '16,185,129' : tab === 'PARTIAL' ? '245,158,11' : '239,68,68'},0.1)`) : '#fff', color: activeTab === tab ? (tab === 'ALL' ? '#ffd369' : clr) : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {tab} <span style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '4px', padding: '0.05rem 0.35rem', fontSize: '0.75rem', fontWeight: '800' }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
                <RefreshCw size={18} className="spin" /> Loading invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
                <CreditCard size={48} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No Rent Invoices Found</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  No invoices available for {selectedMonthFilter}. Click "Create New Bills" to generate them.
                </p>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Resident Info</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Invoice Info</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Amount</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Status</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((inv) => {
                      const resName = inv.resident?.full_name || 'Resident';
                      const resPhone = inv.resident?.phone || '';
                      const pgName = inv.allocation?.pg?.name || 'PG';
                      const roomNo = inv.allocation?.room?.room_number || 'N/A';
                      const bedNo = inv.allocation?.bed?.bed_number || 'N/A';
                      const due = Number(inv.total_amount) - Number(inv.amount_paid);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{resName}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{resPhone && `📱 ${resPhone}`}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{pgName} • Rm {roomNo} • Bed {bedNo}</div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{inv.invoice_number}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{inv.billing_month}</div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#060913' }}>Total: ₹{Number(inv.total_amount).toLocaleString()}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981' }}>Paid: ₹{Number(inv.amount_paid).toLocaleString()}</div>
                              {due > 0 && <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ef4444' }}>Due: ₹{due.toLocaleString()}</div>}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{ fontSize: '0.73rem', fontWeight: '700', padding: '0.35rem 0.65rem', borderRadius: '6px', color: inv.status === 'PAID' ? '#10b981' : inv.status === 'PARTIAL' ? '#f59e0b' : '#ef4444', background: inv.status === 'PAID' ? 'rgba(16,185,129,0.12)' : inv.status === 'PARTIAL' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)' }}>{inv.status}</span>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              {inv.status !== 'PAID' && (
                                <>
                                  <button onClick={() => openDirectPayModal(inv)} style={{ padding: '0.45rem 0.65rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <DollarSign size={14} /> Pay
                                  </button>
                                  <button onClick={() => openRequestModal(inv)} style={{ padding: '0.45rem 0.65rem', background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Clock size={14} /> Verify
                                  </button>
                                </>
                              )}
                              {inv.status === 'PAID' && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#10b981', fontWeight: '700', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(16,185,129,0.08)', borderRadius: '6px' }}>
                                  <CheckCheck size={15} /> Fully Paid
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {filteredInvoices.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <Pagination pagination={invoicesPaginationData} onPageChange={setInvoicesPage} />
              </div>
            )}
          </>
        )}

        {/* ======================== VIEW 2: PENDING REQUESTS ======================== */}
        {mainView === 'REQUESTS' && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: '800', color: '#060913', fontSize: '1.2rem' }}>⏳ Payment Verification Queue</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.25rem' }}>These are payment claims logged by residents. Verify and approve or reject each one.</p>
            </div>

            {loading ? (
              <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
                <RefreshCw size={18} className="spin" /> Loading...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>All Clear!</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No pending payment verifications. All requests are processed.</p>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Resident Info</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Claimed Amount</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Payment Method</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Notes</th>
                      <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthFilteredRequests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s', background: 'rgba(245,158,11,0.02)' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.02)'}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.resident?.full_name || 'Resident'}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📱 {req.resident?.phone || 'N/A'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '0.3rem', fontWeight: '600' }}>Inv: {req.invoice?.invoice_number} ({req.invoice?.billing_month})</div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#060913' }}>₹{Number(req.amount).toLocaleString()}</div>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#d97706', background: 'rgba(245,158,11,0.15)', display: 'inline-block', marginTop: '0.3rem' }}>⏳ PENDING</span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>{req.payment_method}</div>
                          {req.transaction_reference && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Ref: {req.transaction_reference}</div>}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.remarks || '-'}</div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleApprove(req.id)} disabled={submitting} style={{ padding: '0.5rem 0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }} style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {pendingRequests.length > 0 && requestsPagination && (
              <div style={{ marginTop: '1.5rem' }}>
                <Pagination pagination={requestsPagination} onPageChange={setRequestsPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* =================== MODAL: Direct Pay (Flow 1) =================== */}
      {showDirectPayModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDirectPayModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#060913' }}>✅ Mark Payment as Received</h2>
              <button onClick={() => setShowDirectPayModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Owner confirms rent <strong>has been received</strong> directly. Invoice will immediately update to PAID.</p>
            {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleDirectPay} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Resident / Invoice</label>
                <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem', fontWeight: '600', color: '#060913' }}>
                  {selectedInvoice?.resident?.full_name || 'Resident'} — {selectedInvoice?.billing_month} (Due: ₹{(Number(selectedInvoice?.total_amount) - Number(selectedInvoice?.amount_paid)).toLocaleString()})
                </div>
              </div>
              <div><label style={labelStyle}>Amount Received (₹) *</label><input type="number" required value={directPayForm.amount} onChange={(e) => setDirectPayForm({ ...directPayForm, amount: e.target.value })} placeholder="e.g. 8000" style={inputStyle} /></div>
              <div><label style={labelStyle}>Payment Method *</label>
                <select value={directPayForm.payment_method} onChange={(e) => setDirectPayForm({ ...directPayForm, payment_method: e.target.value })} style={inputStyle}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CREDIT_CARD">CREDIT / DEBIT CARD</option>
                </select>
              </div>
              <div><label style={labelStyle}>Transaction Ref / Receipt No (Optional)</label><input type="text" placeholder="e.g. UPI Ref 3091823910" value={directPayForm.transaction_reference} onChange={(e) => setDirectPayForm({ ...directPayForm, transaction_reference: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Remarks (Optional)</label><input type="text" placeholder="e.g. Received in cash by manager" value={directPayForm.remarks} onChange={(e) => setDirectPayForm({ ...directPayForm, remarks: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowDirectPayModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369, #faab36)', color: '#060913', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Confirm Payment ✓'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: Pending Request (Flow 2a) =================== */}
      {showRequestModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowRequestModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#060913' }}>⏳ Log Resident's Payment Claim</h2>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Resident says they've paid but you <strong>haven't verified yet</strong>. Log it here — it'll go into the "Verify Requests" queue for you to approve later.</p>
            {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleCreateRequest} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Resident / Invoice</label>
                <div style={{ padding: '0.6rem 0.85rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.88rem', fontWeight: '600', color: '#92400e' }}>
                  {selectedInvoice?.resident?.full_name || 'Resident'} — {selectedInvoice?.billing_month} (Due: ₹{(Number(selectedInvoice?.total_amount) - Number(selectedInvoice?.amount_paid)).toLocaleString()})
                </div>
              </div>
              <div><label style={labelStyle}>Claimed Amount (₹) *</label><input type="number" required value={requestForm.amount} onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })} placeholder="e.g. 8000" style={inputStyle} /></div>
              <div><label style={labelStyle}>Payment Method *</label>
                <select value={requestForm.payment_method} onChange={(e) => setRequestForm({ ...requestForm, payment_method: e.target.value })} style={inputStyle}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>
              <div><label style={labelStyle}>UPI Ref / Transaction ID (If Shared)</label><input type="text" placeholder="e.g. UPI Ref 3091823910" value={requestForm.transaction_reference} onChange={(e) => setRequestForm({ ...requestForm, transaction_reference: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Notes</label><input type="text" placeholder="e.g. Ramesh says he paid yesterday evening" value={requestForm.remarks} onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: 'rgba(245,158,11,0.2)', color: '#92400e', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Logging...' : 'Log as Pending ⏳'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: Reject Reason (Flow 2c) =================== */}
      {showRejectModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowRejectModal(false); setSelectedRequest(null); } }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#060913', marginBottom: '0.5rem' }}>❌ Reject Payment Request</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Enter reason for rejection. The payment will be marked as FAILED.</p>
            {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleReject} style={{ display: 'grid', gap: '1rem' }}>
              <div><label style={labelStyle}>Reason for Rejection *</label><input required type="text" placeholder="e.g. UPI screenshot not matching / Amount incorrect" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => { setShowRejectModal(false); setSelectedRequest(null); }} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Rejecting...' : 'Reject Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: Generate Monthly Bills =================== */}
      {showGenerateModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGenerateModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#060913' }}>📄 Generate Monthly Bills</h2>
              <button onClick={() => setShowGenerateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Auto-creates rent invoices for all <strong>ACTIVE residents</strong> based on their agreed allocation rent.</p>
            <form onSubmit={handleGenerateInvoices} style={{ display: 'grid', gap: '1rem' }}>
              <div><label style={labelStyle}>Billing Month & Year *</label><input type="month" required value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369, #faab36)', color: '#060913', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Generating...' : 'Generate Bills'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
