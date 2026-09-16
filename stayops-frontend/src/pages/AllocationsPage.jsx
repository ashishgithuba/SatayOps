import React, { useState, useEffect } from 'react';
import { pgService, roomService, bedService, residentService, allocationService } from '../services/api.service';
import { UserCheck, Plus, X, LogOut, CheckCircle2, RefreshCw, Phone, ArrowRightLeft } from 'lucide-react';

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

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState([]);
  const [residents, setResidents] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [transferAvailableBeds, setTransferAvailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [allocateForm, setAllocateForm] = useState({
    resident_id: '',
    bed_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    monthly_rent: '',
    security_deposit: '',
  });

  const [transferForm, setTransferForm] = useState({
    new_bed_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [selectedPg, setSelectedPg] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [transferPg, setTransferPg] = useState('');
  const [transferRoom, setTransferRoom] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('AVAILABLE');

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await allocationService.getAllocations();
      setAllocations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
    residentService.getResidents().then((res) => setResidents(res.data || []));
    pgService.getMyPgs().then((res) => {
      const list = res.data || [];
      setPgs(list);
      if (list.length > 0) {
        setSelectedPg(list[0].id);
        setTransferPg(list[0].id);
      }
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
        setAllocateForm((f) => ({
          ...f,
          bed_id: firstBed.id,
          monthly_rent: firstBed.default_rent ? String(firstBed.default_rent) : f.monthly_rent,
          security_deposit: firstBed.default_security_deposit ? String(firstBed.default_security_deposit) : f.security_deposit,
        }));
      }
    });
  }, [selectedRoom]);

  // Transfer PG/Room change effect
  useEffect(() => {
    if (!transferPg) return;
    roomService.getRoomsByPg(transferPg).then((res) => {
      const roomList = res.data || [];
      if (roomList.length > 0) {
        setTransferRoom(roomList[0].id);
      } else {
        setTransferRoom('');
        setTransferAvailableBeds([]);
      }
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
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await allocationService.allocateBed(allocateForm);
      setSuccessMsg('Bed allocated successfully!');
      setShowAllocateModal(false);
      fetchAllocations();
    } catch (err) {
      setError(err.message || 'Failed to allocate bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    setError('');
    setSubmitting(true);
    try {
      await allocationService.checkout(selectedAllocation.id, {
        check_out_date: new Date().toISOString().split('T')[0],
        bed_status_after_checkout: checkoutStatus,
      });
      setSuccessMsg('Resident checked out successfully!');
      setShowCheckoutModal(false);
      fetchAllocations();
    } catch (err) {
      setError(err.message || 'Failed to checkout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    setError('');
    setSubmitting(true);
    try {
      await allocationService.transfer(selectedAllocation.id, {
        new_bed_id: transferForm.new_bed_id,
        transfer_date: transferForm.transfer_date,
        reason: transferForm.reason || 'Resident requested bed transfer',
      });
      setSuccessMsg('Resident transferred to new bed successfully!');
      setShowTransferModal(false);
      fetchAllocations();
    } catch (err) {
      setError(err.message || 'Failed to transfer bed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Main Content */}
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Bed Allocations & Check-ins</h1>
            <p style={{ color: '#060913', fontSize: '0.9rem', marginTop: '0.2rem' }}>Manage resident check-in dates, bed transfers, monthly rent, and check-outs.</p>
          </div>
          <button
            onClick={() => setShowAllocateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
              color: '#060913',
              padding: '0.75rem 1.4rem',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(255, 211, 105, 0.35)',
            }}
          >
            <Plus size={18} /> New Bed Allocation
          </button>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
            <RefreshCw size={18} className="spin" /> Loading allocations...
          </div>
        ) : allocations.length === 0 ? (
          <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#060913' }}>
            <UserCheck size={48} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No Active Allocations</h3>
            <p style={{ fontSize: '0.9rem' }}>Click "New Bed Allocation" to check in a resident.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {allocations.map((alloc) => {
              const residentName = alloc.resident?.full_name || alloc.resident?.name || 'Resident';
              const residentPhone = alloc.resident?.phone || 'N/A';
              const roomNumber = alloc.room?.room_number || 'N/A';
              const bedNumber = alloc.bed?.bed_number || 'N/A';
              const pgName = alloc.pg?.name || 'PG Property';

              return (
                <div
                  key={alloc.id}
                  className="card-animated"
                  style={{
                    background: 'var(--gradient-card)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.4rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#060913' }}>
                        {residentName}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <Phone size={13} color="#818cf8" /> {residentPhone}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: alloc.status === 'ACTIVE' ? '#10b981' : '#475569', background: alloc.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {alloc.status}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: '700' }}>PROPERTY & BED</div>
                    <div style={{ fontSize: '0.9rem', color: '#060913', fontWeight: '600', marginTop: '0.2rem' }}>
                      {pgName} • Room {roomNumber} ({bedNumber && /^bed[\s-]?/i.test(String(bedNumber).trim()) ? bedNumber : `Bed ${bedNumber}`})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', marginTop: '0.2rem' }}>
                      Rent: ₹{alloc.monthly_rent || alloc.agreed_rent || 0} / month
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#060913', display: 'grid', gap: '0.3rem', marginBottom: '1.25rem' }}>
                    <div><strong>Check-in Date:</strong> {alloc.check_in_date ? new Date(alloc.check_in_date).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Security Deposit:</strong> ₹{alloc.security_deposit || 0}</div>
                  </div>

                  {alloc.status === 'ACTIVE' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedAllocation(alloc);
                          setShowTransferModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowRightLeft size={14} /> Transfer Bed
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAllocation(alloc);
                          setShowCheckoutModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={14} /> Check-out
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allocate Modal - Sibling Fragment */}
      {showAllocateModal && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAllocateModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Allocate Bed</h2>
              <button onClick={() => setShowAllocateModal(false)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAllocateSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Select Resident *</label>
                <select required value={allocateForm.resident_id} onChange={(e) => setAllocateForm({ ...allocateForm, resident_id: e.target.value })} style={inputStyle}>
                  <option value="">-- Select Resident by Name --</option>
                  {residents.map((r) => {
                    const rName = r.full_name || r.name || 'Resident';
                    return (
                      <option key={r.id} value={r.id}>
                        👤 {rName} ({r.phone})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Select PG</label>
                  <select value={selectedPg} onChange={(e) => setSelectedPg(e.target.value)} style={inputStyle}>
                    {pgs.map((pg) => (
                      <option key={pg.id} value={pg.id}>{pg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Room</label>
                  <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} style={inputStyle}>
                    {rooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Available Bed *</label>
                <select
                  required
                  value={allocateForm.bed_id}
                  onChange={(e) => {
                    const bedId = e.target.value;
                    const bedObj = availableBeds.find((b) => b.id === bedId);
                    setAllocateForm({
                      ...allocateForm,
                      bed_id: bedId,
                      monthly_rent: bedObj?.default_rent ? String(bedObj.default_rent) : allocateForm.monthly_rent,
                      security_deposit: bedObj?.default_security_deposit ? String(bedObj.default_security_deposit) : allocateForm.security_deposit,
                    });
                  }}
                  style={inputStyle}
                >
                  {availableBeds.length === 0 ? (
                    <option value="">No available beds in selected room</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        Bed {b.bed_number} {b.default_rent ? `(₹${b.default_rent}/mo)` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Monthly Rent (₹) *</label>
                  <input type="number" required placeholder="e.g. 7500" value={allocateForm.monthly_rent} onChange={(e) => setAllocateForm({ ...allocateForm, monthly_rent: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Security Deposit (₹)</label>
                  <input type="number" placeholder="e.g. 5000" value={allocateForm.security_deposit} onChange={(e) => setAllocateForm({ ...allocateForm, security_deposit: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Check-in Date *</label>
                <input type="date" required value={allocateForm.check_in_date} onChange={(e) => setAllocateForm({ ...allocateForm, check_in_date: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAllocateModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !allocateForm.bed_id} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', border: 'none', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)', cursor: 'pointer' }}>
                  {submitting ? 'Allocating...' : 'Allocate Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Bed Modal - Sibling Fragment */}
      {showTransferModal && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTransferModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Transfer Resident Bed</h2>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#060913', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Transferring <strong>{selectedAllocation?.resident?.full_name || selectedAllocation?.resident?.name || 'Resident'}</strong> from Room {selectedAllocation?.room?.room_number} Bed {selectedAllocation?.bed?.bed_number}.
            </p>

            <form onSubmit={handleTransferSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Target PG</label>
                  <select value={transferPg} onChange={(e) => setTransferPg(e.target.value)} style={inputStyle}>
                    {pgs.map((pg) => (
                      <option key={pg.id} value={pg.id}>{pg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Target Room</label>
                  <select value={transferRoom} onChange={(e) => setTransferRoom(e.target.value)} style={inputStyle}>
                    {rooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Target Available Bed *</label>
                <select required value={transferForm.new_bed_id} onChange={(e) => setTransferForm({ ...transferForm, new_bed_id: e.target.value })} style={inputStyle}>
                  {transferAvailableBeds.length === 0 ? (
                    <option value="">No available beds in selected room</option>
                  ) : (
                    transferAvailableBeds.map((b) => (
                      <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                    ))
                  )}
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !transferForm.new_bed_id} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', border: 'none', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)', cursor: 'pointer' }}>
                  {submitting ? 'Transferring...' : 'Complete Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal - Sibling Fragment */}
      {showCheckoutModal && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCheckoutModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Check-out Resident</h2>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#060913', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Confirm checkout for <strong>{selectedAllocation?.resident?.full_name || selectedAllocation?.resident?.name || 'Resident'}</strong>. Choose status for freed bed:
            </p>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Bed Status After Checkout</label>
                <select value={checkoutStatus} onChange={(e) => setCheckoutStatus(e.target.value)} style={inputStyle}>
                  <option value="AVAILABLE">AVAILABLE (Ready for new resident)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Requires cleaning/repair)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
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