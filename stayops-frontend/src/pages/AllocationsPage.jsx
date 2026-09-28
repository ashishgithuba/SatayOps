import React, { useState, useEffect } from 'react';
import { pgService, roomService, bedService, residentService, allocationService } from '../services/api.service';
import { UserCheck, Plus, X, LogOut, CheckCircle2, RefreshCw, Phone, ArrowRightLeft, BedDouble, Building2, CalendarCheck } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState([]);
  const [residents, setResidents] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [transferAvailableBeds, setTransferAvailableBeds] = useState([]);
  const [transferRooms, setTransferRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState(null);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [allocateForm, setAllocateForm] = useState({
    resident_id: '', bed_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    monthly_rent: '', security_deposit: '',
  });

  const [transferForm, setTransferForm] = useState({
    new_bed_id: '', transfer_date: new Date().toISOString().split('T')[0], reason: '',
  });

  const [selectedPg, setSelectedPg] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [transferPg, setTransferPg] = useState('');
  const [transferRoom, setTransferRoom] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('AVAILABLE');

  const fetchAllocations = async (page = 1) => {
    setLoading(true);
    try {
      const res = await allocationService.getAllocations({ page, limit: 10 });
      setAllocations(res.data || []);
      setPaginationData(res.pagination || null);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAllocations(currentPage); }, [currentPage]);

  useEffect(() => {
    residentService.getResidents().then((res) => setResidents(res.data || []));
    pgService.getMyPgs().then((res) => {
      const list = res.data || [];
      setPgs(list);
      if (list.length > 0) { setSelectedPg(list[0].id); setTransferPg(list[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selectedPg) return;
    roomService.getRoomsByPg(selectedPg).then((res) => {
      const list = res.data || [];
      setRooms(list);
      if (list.length > 0) setSelectedRoom(list[0].id);
      else setAvailableBeds([]);
    });
  }, [selectedPg]);

  useEffect(() => {
    if (!selectedRoom) return;
    bedService.getBedsByRoom(selectedRoom).then((res) => {
      const list = (res.data || []).filter((b) => b.status === 'AVAILABLE');
      setAvailableBeds(list);
      if (list.length > 0) {
        const firstBed = list[0];
        setAllocateForm((f) => ({ ...f, bed_id: firstBed.id, monthly_rent: firstBed.default_rent ? String(firstBed.default_rent) : f.monthly_rent, security_deposit: firstBed.default_security_deposit ? String(firstBed.default_security_deposit) : f.security_deposit }));
      }
    });
  }, [selectedRoom]);

  useEffect(() => {
    if (!transferPg) return;
    roomService.getRoomsByPg(transferPg).then((res) => {
      const roomList = res.data || [];
      setTransferRooms(roomList);
      if (roomList.length > 0) setTransferRoom(roomList[0].id);
      else { setTransferRoom(''); setTransferAvailableBeds([]); }
    });
  }, [transferPg]);

  useEffect(() => {
    if (!transferRoom) return;
    bedService.getBedsByRoom(transferRoom).then((res) => {
      const list = (res.data || []).filter((b) => b.status === 'AVAILABLE');
      setTransferAvailableBeds(list);
      if (list.length > 0) setTransferForm((f) => ({ ...f, new_bed_id: list[0].id }));
    });
  }, [transferRoom]);

  const handleAllocateSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccessMsg(''); setSubmitting(true);
    try {
      await allocationService.allocateBed(allocateForm);
      setSuccessMsg('Bed allocated successfully!'); setShowAllocateModal(false); fetchAllocations(currentPage);
    } catch (err) { setError(err.message || 'Failed to allocate bed'); } finally { setSubmitting(false); }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault(); if (!selectedAllocation) return; setError(''); setSubmitting(true);
    try {
      await allocationService.checkout(selectedAllocation.id, { check_out_date: new Date().toISOString().split('T')[0], bed_status_after_checkout: checkoutStatus });
      setSuccessMsg('Resident checked out successfully!'); setShowCheckoutModal(false); fetchAllocations(currentPage);
    } catch (err) { setError(err.message || 'Failed to checkout'); } finally { setSubmitting(false); }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault(); if (!selectedAllocation) return; setError(''); setSubmitting(true);
    try {
      await allocationService.transfer(selectedAllocation.id, { new_bed_id: transferForm.new_bed_id, transfer_date: transferForm.transfer_date, reason: transferForm.reason || 'Resident requested bed transfer' });
      setSuccessMsg('Resident transferred to new bed successfully!'); setShowTransferModal(false); fetchAllocations(currentPage);
    } catch (err) { setError(err.message || 'Failed to transfer bed'); } finally { setSubmitting(false); }
  };

  const activeCount = allocations.filter(a => a.status === 'ACTIVE').length;
  const checkedOut = allocations.filter(a => a.status !== 'ACTIVE').length;

  /* ─── Shared modal styles ─── */
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(6,16,13,0.75)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto' };
  const modalCard = { background: '#0e1f1a', border: '1px solid rgba(255,211,105,0.15)', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 30px 70px rgba(0,0,0,0.8)', position: 'relative' };
  const inputStyle = { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' };

  return (
    <>
      {/* Main Content */}
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#0f172a' }}>Bed Allocations</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Manage check-ins, transfers, and checkouts</p>
          </div>
          <button
            onClick={() => setShowAllocateModal(true)}
            style={{ background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,211,105,0.35)' }}
          >
            <Plus size={18} /> New Allocation
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { icon: <UserCheck size={20} />, label: 'Total', value: allocations.length, color: '#6366f1', bg: '#eef2ff' },
            { icon: <BedDouble size={20} />, label: 'Active', value: activeCount, color: '#10b981', bg: '#d1fae5' },
            { icon: <LogOut size={20} />, label: 'Checked Out', value: checkedOut, color: '#f59e0b', bg: '#fef3c7' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: '14px', padding: '1.1rem 1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Message */}
        {successMsg && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '0.9rem 1.1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '600' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '3rem 0', color: '#64748b', fontSize: '0.95rem' }}>
            <RefreshCw size={20} className="spin" /> Loading allocations...
          </div>
        ) : allocations.length === 0 ? (
          <div style={{ background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
            <UserCheck size={48} color="#c7d2fe" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem' }}>No Active Allocations</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Click "New Allocation" to check in a resident.</p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Resident', 'Property & Bed', 'Financials', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc, idx) => {
                    const residentName = alloc.resident?.full_name || alloc.resident?.name || 'Resident';
                    const residentPhone = alloc.resident?.phone || 'N/A';
                    const roomNumber = alloc.room?.room_number || 'N/A';
                    const bedNumber = alloc.bed?.bed_number || 'N/A';
                    const pgName = alloc.pg?.name || 'PG Property';
                    const bedLabel = /^bed[\s-]?/i.test(String(bedNumber).trim()) ? bedNumber : `Bed ${bedNumber}`;
                    const isActive = alloc.status === 'ACTIVE';

                    return (
                      <tr key={alloc.id}
                        style={{ borderBottom: idx < allocations.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
                              {residentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>{residentName}</div>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                                <Phone size={11} /> {residentPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: '600', fontSize: '0.88rem' }}>
                            <Building2 size={13} color="#6366f1" /> {pgName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BedDouble size={12} /> Room {roomNumber} · {bedLabel}
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                            ₹{(alloc.monthly_rent || alloc.agreed_rent || 0).toLocaleString()}<span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>/mo</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            Dep: ₹{(alloc.security_deposit || 0).toLocaleString()} · <CalendarCheck size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {alloc.check_in_date ? new Date(alloc.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', fontWeight: '700', color: isActive ? '#10b981' : '#94a3b8', background: isActive ? '#d1fae5' : '#f1f5f9', padding: '0.3rem 0.7rem', borderRadius: '20px', border: `1px solid ${isActive ? '#a7f3d0' : '#e2e8f0'}` }}>
                            {isActive ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> : null}
                            {alloc.status}
                          </span>
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          {isActive ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => { setSelectedAllocation(alloc); setShowTransferModal(true); }}
                                style={{ padding: '0.4rem 0.8rem', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                              >
                                <ArrowRightLeft size={13} /> Transfer
                              </button>
                              <button
                                onClick={() => { setSelectedAllocation(alloc); setShowCheckoutModal(true); }}
                                style={{ padding: '0.4rem 0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                              >
                                <LogOut size={13} /> Checkout
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && allocations.length > 0 && (
          <Pagination pagination={paginationData} onPageChange={setCurrentPage} />
        )}
      </div>

      {/* ─── Allocate Bed Modal ─── */}
      {showAllocateModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAllocateModal(false); }} style={modalOverlay}>
          <div className="animate-pop-in" style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#ffd369', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>New Allocation</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f1f5f9' }}>Allocate Bed</h2>
              </div>
              <button onClick={() => setShowAllocateModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '0.4rem', display: 'flex', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            <form onSubmit={handleAllocateSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Select Resident *</label>
                <select required value={allocateForm.resident_id} onChange={(e) => setAllocateForm({ ...allocateForm, resident_id: e.target.value })} style={inputStyle}>
                  <option value="">-- Select Resident --</option>
                  {residents.map((r) => <option key={r.id} value={r.id}>{r.full_name || r.name} ({r.phone})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Select PG</label>
                  <select value={selectedPg} onChange={(e) => setSelectedPg(e.target.value)} style={inputStyle}>
                    {pgs.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Room</label>
                  <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} style={inputStyle}>
                    {rooms.map((rm) => <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Available Bed *</label>
                <select required value={allocateForm.bed_id} onChange={(e) => { const bedObj = availableBeds.find(b => b.id === e.target.value); setAllocateForm({ ...allocateForm, bed_id: e.target.value, monthly_rent: bedObj?.default_rent ? String(bedObj.default_rent) : allocateForm.monthly_rent, security_deposit: bedObj?.default_security_deposit ? String(bedObj.default_security_deposit) : allocateForm.security_deposit }); }} style={inputStyle}>
                  {availableBeds.length === 0 ? <option value="">No available beds</option> : availableBeds.map(b => <option key={b.id} value={b.id}>Bed {b.bed_number} {b.default_rent ? `(₹${b.default_rent}/mo)` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Monthly Rent (₹) *</label>
                  <input type="number" required placeholder="7500" value={allocateForm.monthly_rent} onChange={(e) => setAllocateForm({ ...allocateForm, monthly_rent: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Security Deposit (₹)</label>
                  <input type="number" placeholder="5000" value={allocateForm.security_deposit} onChange={(e) => setAllocateForm({ ...allocateForm, security_deposit: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Check-in Date *</label>
                <input type="date" required value={allocateForm.check_in_date} onChange={(e) => setAllocateForm({ ...allocateForm, check_in_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAllocateModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting || !allocateForm.bed_id} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', border: 'none', borderRadius: '10px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255,211,105,0.3)', cursor: 'pointer' }}>
                  {submitting ? 'Allocating...' : 'Allocate Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Transfer Modal ─── */}
      {showTransferModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTransferModal(false); }} style={modalOverlay}>
          <div className="animate-pop-in" style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Bed Transfer</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f1f5f9' }}>Transfer Resident Bed</h2>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '0.4rem', display: 'flex', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#a5b4fc' }}>
              Transferring <strong style={{ color: '#f1f5f9' }}>{selectedAllocation?.resident?.full_name || selectedAllocation?.resident?.name || 'Resident'}</strong> from Room <strong style={{ color: '#f1f5f9' }}>{selectedAllocation?.room?.room_number}</strong> · Bed <strong style={{ color: '#f1f5f9' }}>{selectedAllocation?.bed?.bed_number}</strong>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Target PG</label>
                  <select value={transferPg} onChange={(e) => setTransferPg(e.target.value)} style={inputStyle}>
                    {pgs.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Target Room</label>
                  <select value={transferRoom} onChange={(e) => setTransferRoom(e.target.value)} style={inputStyle}>
                    {transferRooms.length === 0 ? <option value="">No rooms found</option> : transferRooms.map(rm => <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Target Available Bed *</label>
                <select required value={transferForm.new_bed_id} onChange={(e) => setTransferForm({ ...transferForm, new_bed_id: e.target.value })} style={inputStyle}>
                  {transferAvailableBeds.length === 0 ? <option value="">No available beds in selected room</option> : transferAvailableBeds.map(b => <option key={b.id} value={b.id}>Bed {b.bed_number}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transfer Date *</label>
                <input type="date" required value={transferForm.transfer_date} onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Reason / Notes</label>
                <input type="text" placeholder="e.g. Shifted to AC room upon request" value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting || !transferForm.new_bed_id} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', boxShadow: '0 6px 18px rgba(99,102,241,0.3)', cursor: 'pointer' }}>
                  {submitting ? 'Transferring...' : 'Complete Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Checkout Modal ─── */}
      {showCheckoutModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCheckoutModal(false); }} style={modalOverlay}>
          <div className="animate-pop-in" style={{ ...modalCard, maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Checkout</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f1f5f9' }}>Check-out Resident</h2>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '0.4rem', display: 'flex', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#fca5a5' }}>
              Confirming checkout for <strong style={{ color: '#f1f5f9' }}>{selectedAllocation?.resident?.full_name || selectedAllocation?.resident?.name || 'Resident'}</strong>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Bed Status After Checkout</label>
                <select value={checkoutStatus} onChange={(e) => setCheckoutStatus(e.target.value)} style={inputStyle}>
                  <option value="AVAILABLE">AVAILABLE — Ready for new resident</option>
                  <option value="MAINTENANCE">MAINTENANCE — Requires cleaning / repair</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', boxShadow: '0 6px 18px rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                  {submitting ? 'Checking out...' : 'Confirm Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
