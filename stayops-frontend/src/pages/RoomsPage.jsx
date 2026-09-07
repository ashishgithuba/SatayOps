import React, { useState, useEffect } from 'react';
import { pgService, floorService, roomService } from '../services/api.service';
import { Layers, Plus, X, Building2, Tag } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.75rem', background: '#ffffff', fontSize: '1rem',
  border: '1px solid #cbd5e1', borderRadius: '8px', color: '#060913',
};
const labelStyle = {
  display: 'block', color: '#060913', fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: '700',
};

export default function RoomsPage() {
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedPg, setSelectedPg] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [floorForm, setFloorForm] = useState({ pg_id: '', floor_number: '', floor_name: '' });
  const [roomForm, setRoomForm] = useState({
    floor_id: '', room_number: '', room_type: 'SINGLE', description: '',
  });

  useEffect(() => {
    pgService.getMyPgs().then(res => {
      const list = res.rows || [];
      setPgs(list);
      if (list.length > 0) {
        setSelectedPg(list[0].id);
        setFloorForm(f => ({ ...f, pg_id: list[0].id }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPg) return;
    setLoading(true);
    floorService.getFloorsByPg(selectedPg)
      .then(res => {
        const floorList = res.data || [];
        setFloors(floorList);
        if (floorList.length > 0) {
          setSelectedFloor(floorList[0].id);
        } else {
          setSelectedFloor('');
        }
      })
      .catch(() => setFloors([]))
      .finally(() => setLoading(false));
    setRooms([]);
  }, [selectedPg]);

  useEffect(() => {
    if (!selectedFloor) return;
    setLoading(true);
    roomService.getRoomsByFloor(selectedFloor)
      .then(res => setRooms(res.rows || []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [selectedFloor]);

  const activePgObj = pgs.find(p => p.id === selectedPg);
  const activeFloorObj = floors.find(f => f.id === selectedFloor);

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await floorService.createFloor({ ...floorForm, pg_id: selectedPg });
      setShowFloorModal(false);
      setFloorForm({ pg_id: selectedPg, floor_number: '', floor_name: '' });
      const res = await floorService.getFloorsByPg(selectedPg);
      setFloors(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to create floor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await roomService.createRoom({ ...roomForm, floor_id: selectedFloor });
      setShowRoomModal(false);
      setRoomForm({ floor_id: selectedFloor, room_number: '', room_type: 'SINGLE', description: '' });
      const res = await roomService.getRoomsByFloor(selectedFloor);
      setRooms(res.rows || []);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'ACTIVE') return '#10b981';
    if (status === 'INACTIVE') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Floors & Rooms Directory</h1>
          <p style={{ color: '#060913', fontSize: '0.9rem', marginTop: '0.2rem' }}>Organize floor layouts, sharing options, and room availability.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFloorModal(true)}
            disabled={!selectedPg}
            style={{
              background: selectedPg ? 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)' : '#374151',
              color: selectedPg ? '#060913' : '#475569',
              border: selectedPg ? 'none' : '1px solid rgba(255,255,255,0.1)',
              padding: '0.65rem 1.1rem',
              borderRadius: '9px',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: selectedPg ? '0 8px 20px rgba(255, 211, 105, 0.35)' : 'none',
              opacity: selectedPg ? 1 : 0.6,
            }}
          >
            <Plus size={16} /> Add Floor
          </button>
          <button
            onClick={() => setShowRoomModal(true)}
            disabled={!selectedFloor}
            style={{
              background: selectedFloor ? 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)' : '#374151',
              color: selectedFloor ? '#060913' : '#475569',
              border: selectedFloor ? 'none' : '1px solid rgba(255,255,255,0.1)',
              padding: '0.65rem 1.1rem',
              borderRadius: '9px',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: selectedFloor ? '0 8px 20px rgba(255, 211, 105, 0.35)' : 'none',
              opacity: selectedFloor ? 1 : 0.6,
            }}
          >
            <Plus size={16} /> Add Room
          </button>
        </div>
      </div>

      {/* PG & Floor Selectors */}
      <div style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Selected PG Property</label>
          <select value={selectedPg} onChange={e => { setSelectedPg(e.target.value); setFloorForm(f => ({ ...f, pg_id: e.target.value })); }} style={{ ...inputStyle, background: '#ffffff' }}>
            {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Selected Floor</label>
          <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)} style={{ ...inputStyle, background: '#ffffff' }}>
            <option value="">-- Choose Floor --</option>
            {floors.map(fl => <option key={fl.id} value={fl.id}>{fl.floor_name ? `${fl.floor_name} (Floor ${fl.floor_number})` : `Floor ${fl.floor_number}`}</option>)}
          </select>
        </div>
      </div>

      {/* Selected Floor Context Banner */}
      {activeFloorObj && (
        <div style={{ background: 'rgba(255, 211, 105, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#b45309', fontWeight: '700', fontSize: '0.92rem' }}>
            <Layers size={18} />
            <span>Currently Viewing: <strong style={{ color: '#78350f' }}>{activeFloorObj.floor_name || `Floor ${activeFloorObj.floor_number}`}</strong> ({activePgObj?.name})</span>
          </div>
          <span style={{ fontSize: '0.8rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '800' }}>
            {rooms.length} Room{rooms.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Floors Cards Tabs */}
      {floors.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Switch Floor:</label>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {floors.map(fl => {
              const isSelected = fl.id === selectedFloor;
              return (
                <div
                  key={fl.id}
                  onClick={() => setSelectedFloor(fl.id)}
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)' : 'var(--gradient-card)',
                    border: isSelected ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.75rem 1.2rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: isSelected ? '#060913' : '#475569',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '0.88rem',
                    boxShadow: isSelected ? '0 4px 14px rgba(255, 211, 105, 0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🏢 {fl.floor_name || `Floor ${fl.floor_number}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      {selectedFloor ? (
        <>
          {loading ? (
            <div style={{ color: '#060913', padding: '2rem 0' }}>Loading rooms for floor...</div>
          ) : rooms.length === 0 ? (
            <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#060913' }}>
              <Layers size={40} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <p>No rooms found in <strong>{activeFloorObj?.floor_name || `Floor ${activeFloorObj?.floor_number}`}</strong>. Click "Add Room" to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {rooms.map(room => (
                <div key={room.id} className="card-animated" style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#060913', fontSize: '1.1rem' }}>Room {room.room_number}</div>
                      <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: '600', marginTop: '0.2rem' }}>{room.room_type?.replace('_', ' ')}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: statusColor(room.status), background: `${statusColor(room.status)}18`, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      {room.status}
                    </span>
                  </div>

                  {/* Explicit Floor Label on Card */}
                  <div style={{ fontSize: '0.78rem', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    <Tag size={13} color="#d97706" />
                    <span>Floor: <strong>{activeFloorObj?.floor_name || `Floor ${activeFloorObj?.floor_number}`}</strong></span>
                  </div>

                  {room.description && <p style={{ fontSize: '0.82rem', color: '#060913', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>{room.description}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#060913' }}>
          Please select a floor above to view or add rooms.
        </div>
      )}

      {/* Floor Modal */}
      {showFloorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: '700', color: '#060913' }}>Add New Floor</h2>
                <p style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: '600' }}>For: {activePgObj?.name}</p>
              </div>
              <button onClick={() => setShowFloorModal(false)} style={{ background: 'transparent', color: '#060913' }}><X size={20} /></button>
            </div>
            {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', padding: '0.65rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleFloorSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Floor Number *</label>
                <input type="number" required placeholder="e.g. 1" style={inputStyle} value={floorForm.floor_number} onChange={e => setFloorForm(f => ({ ...f, floor_number: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Floor Name (Optional)</label>
                <input type="text" placeholder="e.g. 1st Floor / Executive Wing" style={inputStyle} value={floorForm.floor_name} onChange={e => setFloorForm(f => ({ ...f, floor_name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowFloorModal(false)} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.7rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)' }}>{submitting ? 'Creating...' : 'Create Floor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: '700', color: '#060913', fontSize: '1.25rem' }}>Add New Room</h2>
                <div style={{ background: 'rgba(99,102,241,0.15)', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-block', marginTop: '0.3rem' }}>
                  Floor: {activeFloorObj?.floor_name || `Floor ${activeFloorObj?.floor_number}`} ({activePgObj?.name})
                </div>
              </div>
              <button onClick={() => setShowRoomModal(false)} style={{ background: 'transparent', color: '#060913' }}><X size={20} /></button>
            </div>
            {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', padding: '0.65rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleRoomSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Room Number *</label>
                <input type="text" required placeholder="e.g. 101 or 1A" style={inputStyle} value={roomForm.room_number} onChange={e => setRoomForm(f => ({ ...f, room_number: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Room Type *</label>
                <select required style={inputStyle} value={roomForm.room_type} onChange={e => setRoomForm(f => ({ ...f, room_type: e.target.value }))}>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE_SHARING">Double Sharing</option>
                  <option value="TRIPLE_SHARING">Triple Sharing</option>
                  <option value="FOUR_SHARING">4 Sharing</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description / Amenities</label>
                <textarea rows={2} placeholder="e.g. Balcony view, AC Room..." style={inputStyle} value={roomForm.description} onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowRoomModal(false)} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.7rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)' }}>{submitting ? 'Creating Room' : 'Create Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
