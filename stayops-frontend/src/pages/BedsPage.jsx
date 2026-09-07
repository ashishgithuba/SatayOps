import React, { useState, useEffect } from 'react';
import { pgService, roomService, bedService } from '../services/api.service';
import { Bed, Plus, X, RefreshCw, Tag, AlertCircle, Edit, Trash2 } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.75rem', background: '#ffffff', fontSize: '1rem',
  border: '1px solid #cbd5e1', borderRadius: '8px', color: '#060913',
};
const labelStyle = {
  display: 'block', color: '#060913', fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: '700',
};

const ROOM_CAPACITY_LIMITS = {
  SINGLE: 1,
  DOUBLE_SHARING: 2,
  TRIPLE_SHARING: 3,
  FOUR_SHARING: 4,
  DORMITORY: 50,
};

export default function BedsPage() {
  const [pgs, setPgs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedPg, setSelectedPg] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    room_id: '',
    bed_number: '',
    description: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    pgService.getMyPgs().then((res) => {
      const list = res.rows || [];
      setPgs(list);
      if (list.length > 0) setSelectedPg(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedPg) return;
    roomService.getRoomsByPg(selectedPg).then((res) => {
      const roomList = res.rows || [];
      setRooms(roomList);
      if (roomList.length > 0) setSelectedRoom(roomList[0].id);
      else {
        setSelectedRoom('');
        setBeds([]);
      }
    });
  }, [selectedPg]);

  const fetchBeds = () => {
    if (!selectedRoom) return;
    setLoading(true);
    bedService
      .getBedsByRoom(selectedRoom)
      .then((res) => setBeds(res.data || []))
      .catch(() => setBeds([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBeds();
  }, [selectedRoom]);

  const activeRoomObj = rooms.find((r) => r.id === selectedRoom);
  const maxCapacity = activeRoomObj ? ROOM_CAPACITY_LIMITS[activeRoomObj.room_type] || 50 : 50;
  const isRoomFull = beds.length >= maxCapacity;

  const openCreateModal = () => {
    setEditingBed(null);
    setFormData({ room_id: selectedRoom, bed_number: '', description: '', status: 'AVAILABLE' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (bed) => {
    setEditingBed(bed);
    setFormData({
      room_id: bed.room_id || selectedRoom,
      bed_number: bed.bed_number,
      description: bed.description || '',
      status: bed.status || 'AVAILABLE',
    });
    setError('');
    setShowModal(true);
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      await bedService.deleteBed(bedId);
      fetchBeds();
    } catch (err) {
      alert(err.message || 'Failed to delete bed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editingBed && isRoomFull) {
      setError(`Cannot add bed. Maximum capacity of ${maxCapacity} bed(s) reached for this room type.`);
      return;
    }

    setSubmitting(true);
    try {
      if (editingBed) {
        await bedService.updateBed(editingBed.id, {
          bed_number: formData.bed_number,
          status: formData.status,
          description: formData.description || null,
        });
      } else {
        await bedService.createBed({
          room_id: selectedRoom,
          bed_number: formData.bed_number,
          status: formData.status,
          description: formData.description || null,
        });
      }
      setShowModal(false);
      setEditingBed(null);
      setFormData({ room_id: '', bed_number: '', description: '', status: 'AVAILABLE' });
      fetchBeds();
    } catch (err) {
      setError(err.message || 'Failed to save bed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Available' };
      case 'OCCUPIED':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Occupied' };
      case 'MAINTENANCE':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Maintenance' };
      default:
        return { color: '#060913', bg: 'rgba(156, 163, 175, 0.12)', label: status };
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Beds Inventory & Occupancy</h1>
          <p style={{ color: '#060913', fontSize: '0.9rem', marginTop: '0.2rem' }}>Track individual bed availability, room capacity limits, and maintenance.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedRoom || isRoomFull}
          title={isRoomFull ? `Capacity limit (${maxCapacity} beds) reached` : 'Add New Bed'}
          style={{
            background: isRoomFull || !selectedRoom ? '#374151' : 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
            color: isRoomFull || !selectedRoom ? '#475569' : '#060913',
            padding: '0.75rem 1.4rem',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: isRoomFull || !selectedRoom ? 'none' : '0 8px 20px rgba(255, 211, 105, 0.35)',
            opacity: isRoomFull || !selectedRoom ? 0.6 : 1,
            cursor: isRoomFull ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={18} /> {isRoomFull ? 'Room Full' : 'Add New Bed'}
        </button>
      </div>

      {/* Selectors */}
      <div style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Select PG</label>
          <select value={selectedPg} onChange={(e) => setSelectedPg(e.target.value)} style={{ ...inputStyle, background: '#ffffff' }}>
            {pgs.map((pg) => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Select Room</label>
          <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} style={{ ...inputStyle, background: '#ffffff' }}>
            {rooms.length === 0 ? (
              <option value="">No rooms available</option>
            ) : (
              rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} ({r.room_type?.replace('_', ' ')})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Room Context & Capacity Indicator */}
      {activeRoomObj && (
        <div style={{ background: isRoomFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 211, 105, 0.1)', border: isRoomFull ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 211, 105,0.2)', borderRadius: '10px', padding: '0.8rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ color: isRoomFull ? '#f87171' : '#d97706', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isRoomFull && <AlertCircle size={18} />}
            <span>Room: <strong style={{ color: '#78350f' }}>Room {activeRoomObj.room_number}</strong> ({activeRoomObj.room_type?.replace('_', ' ')})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: isRoomFull ? '#ef4444' : '#10b981', background: isRoomFull ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', padding: '0.25rem 0.75rem', borderRadius: '6px', fontWeight: '700' }}>
            Capacity: {beds.length} / {maxCapacity} Beds {isRoomFull ? '(FULL)' : ''}
          </span>
        </div>
      )}

      {/* Beds Grid */}
      {loading ? (
        <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
          <RefreshCw size={18} className="spin" /> Loading beds...
        </div>
      ) : beds.length === 0 ? (
        <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#060913' }}>
          <Bed size={48} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No Beds Configured for Room {activeRoomObj?.room_number}</h3>
          <p style={{ fontSize: '0.9rem' }}>Click "Add New Bed" to add up to {maxCapacity} beds for this {activeRoomObj?.room_type?.replace('_', ' ')} room.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {beds.map((bed) => {
            const badge = getStatusBadge(bed.status);
            return (
              <div
                key={bed.id}
                className="card-animated"
                style={{
                  background: 'var(--gradient-card)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.4rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ background: 'rgba(255, 211, 105, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#d97706' }}>
                        <Bed size={20} />
                      </div>
                      <div style={{ fontWeight: '700', color: '#060913', fontSize: '1.1rem' }}>
                        {bed.bed_number && /^bed[\s-]?/i.test(bed.bed_number.trim()) ? bed.bed_number : `Bed ${bed.bed_number}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: badge.color, background: badge.bg, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={14} /> Room {activeRoomObj?.room_number || 'N/A'}
                  </div>

                  {bed.description && (
                    <div style={{ fontSize: '0.82rem', color: '#060913', marginBottom: '0.75rem' }}>
                      {bed.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => openEditModal(bed)}
                    style={{ background: 'rgba(255, 211, 105, 0.15)', color: '#d97706', border: '1px solid rgba(255, 211, 105, 0.25)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBed(bed.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>{editingBed ? 'Edit Bed Details' : 'Add New Bed'}</h2>
                <div style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: '600' }}>
                  Room {activeRoomObj?.room_number} ({activeRoomObj?.room_type?.replace('_', ' ')})
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: '#060913' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Bed Number / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed-1, Bed-A, or 101-A"
                  value={formData.bed_number}
                  onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Bed Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                  <option value="AVAILABLE">AVAILABLE (Ready for check-in)</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Window side bed, near AC..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)' }}>
                  {submitting ? 'Saving...' : editingBed ? 'Update Bed' : 'Create Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
