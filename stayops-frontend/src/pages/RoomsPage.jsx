import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pgService, floorService, roomService, bedService } from '../services/api.service';
import {
  Layers,
  Plus,
  X,
  Building2,
  Tag,
  Bed as BedIcon,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Briefcase,
  MapPin,
  RefreshCw,
} from 'lucide-react';

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

const ROOM_CAPACITY_LIMITS = {
  SINGLE: 1,
  DOUBLE_SHARING: 2,
  TRIPLE_SHARING: 3,
  FOUR_SHARING: 4,
  DORMITORY: 50,
};

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');

export default function RoomsPage() {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedPg, setSelectedPg] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [selectedResidentDetail, setSelectedResidentDetail] = useState(null);

  // Editing state
  const [targetRoomForBed, setTargetRoomForBed] = useState(null);
  const [editingBed, setEditingBed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [floorForm, setFloorForm] = useState({ pg_id: '', floor_number: '', name: '' });
  const [roomForm, setRoomForm] = useState({
    floor_id: '',
    room_number: '',
    room_type: 'SINGLE',
    description: '',
  });
  const [bedForm, setBedForm] = useState({
    room_id: '',
    bed_number: '',
    description: '',
    status: 'AVAILABLE',
    default_rent: '',
    default_security_deposit: '',
  });

  // Load PGs on mount
  useEffect(() => {
    pgService
      .getMyPgs()
      .then((res) => {
        const list = res.data || [];
        setPgs(list);
        if (list.length > 0) {
          setSelectedPg(list[0].id);
          setFloorForm((f) => ({ ...f, pg_id: list[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Load floors when PG changes
  useEffect(() => {
    if (!selectedPg) return;
    setLoading(true);
    floorService
      .getFloorsByPg(selectedPg)
      .then((res) => {
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

  // Refresh rooms on active floor
  const fetchRooms = () => {
    if (!selectedFloor) return;
    setLoading(true);
    roomService
      .getRoomsByFloor(selectedFloor)
      .then((res) => setRooms(res.data || []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor]);

  const activePgObj = pgs.find((p) => p.id === selectedPg);
  const activeFloorObj = floors.find((f) => f.id === selectedFloor);

  // Statistics calculation for the current floor
  const allBeds = rooms.flatMap((r) => r.beds || []);
  const totalBedsCount = allBeds.length;
  const occupiedBedsCount = allBeds.filter((b) => b.status === 'OCCUPIED').length;
  const availableBedsCount = allBeds.filter((b) => b.status === 'AVAILABLE').length;

  // Handle floor creation
  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await floorService.createFloor({ ...floorForm, pg_id: selectedPg });
      setShowFloorModal(false);
      setFloorForm({ pg_id: selectedPg, floor_number: '', name: '' });
      const res = await floorService.getFloorsByPg(selectedPg);
      setFloors(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to create floor');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle room creation
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await roomService.createRoom({ ...roomForm, floor_id: selectedFloor });
      setShowRoomModal(false);
      setRoomForm({ floor_id: selectedFloor, room_number: '', room_type: 'SINGLE', description: '' });
      fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bed creation / update
  const openAddBedModal = (room) => {
    setTargetRoomForBed(room);
    setEditingBed(null);
    setBedForm({
      room_id: room.id,
      bed_number: '',
      description: '',
      status: 'AVAILABLE',
      default_rent: '',
      default_security_deposit: '',
    });
    setError('');
    setShowBedModal(true);
  };

  const openEditBedModal = (room, bed, e) => {
    if (e) e.stopPropagation();
    setTargetRoomForBed(room);
    setEditingBed(bed);
    setBedForm({
      room_id: room.id,
      bed_number: bed.bed_number,
      description: bed.description || '',
      status: bed.status || 'AVAILABLE',
      default_rent: bed.default_rent || '',
      default_security_deposit: bed.default_security_deposit || '',
    });
    setError('');
    setShowBedModal(true);
  };

  const handleDeleteBed = async (bedId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      await bedService.deleteBed(bedId);
      fetchRooms();
    } catch (err) {
      alert(err.message || 'Failed to delete bed');
    }
  };

  const handleBedSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingBed) {
        await bedService.updateBed(editingBed.id, {
          bed_number: bedForm.bed_number,
          status: bedForm.status,
          description: bedForm.description || null,
          default_rent: bedForm.default_rent ? Number(bedForm.default_rent) : 0,
          default_security_deposit: bedForm.default_security_deposit ? Number(bedForm.default_security_deposit) : 0,
        });
      } else {
        await bedService.createBed({
          room_id: targetRoomForBed.id,
          bed_number: bedForm.bed_number,
          status: bedForm.status,
          description: bedForm.description || null,
          default_rent: bedForm.default_rent ? Number(bedForm.default_rent) : 0,
          default_security_deposit: bedForm.default_security_deposit ? Number(bedForm.default_security_deposit) : 0,
        });
      }
      setShowBedModal(false);
      setEditingBed(null);
      setTargetRoomForBed(null);
      fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to save bed');
    } finally {
      setSubmitting(false);
    }
  };

  // Open resident modal
  const handleBedClick = (bed, room) => {
    const activeAlloc = bed.allocations?.[0];
    if (activeAlloc?.resident) {
      setSelectedResidentDetail({
        resident: activeAlloc.resident,
        allocation: activeAlloc,
        bed,
        room,
        floor: activeFloorObj,
      });
    } else if (bed.status === 'OCCUPIED') {
      alert('This bed is marked as OCCUPIED but has no active resident allocation attached.');
    } else {
      // If available, offer to edit bed details
      openEditBedModal(room, bed);
    }
  };

  const statusColor = (status) => {
    if (status === 'ACTIVE' || status === 'AVAILABLE') return '#10b981';
    if (status === 'OCCUPIED') return '#ef4444';
    if (status === 'INACTIVE' || status === 'MAINTENANCE') return '#f59e0b';
    return '#64748b';
  };

  return (
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>
              Rooms & Beds Directory
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Manage floors, rooms, and bed occupancy. Click any occupied bed to view resident details.
            </p>
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
                cursor: selectedPg ? 'pointer' : 'not-allowed',
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
                cursor: selectedFloor ? 'pointer' : 'not-allowed',
              }}
            >
              <Plus size={16} /> Add Room
            </button>
          </div>
        </div>

        {/* PG & Floor Selectors */}
        <div
          style={{
            background: 'var(--gradient-card)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 220px' }}>
            <label style={labelStyle}>Selected PG Property</label>
            <select
              value={selectedPg}
              onChange={(e) => {
                setSelectedPg(e.target.value);
                setFloorForm((f) => ({ ...f, pg_id: e.target.value }));
              }}
              style={{ ...inputStyle, background: '#ffffff' }}
            >
              {pgs.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <label style={labelStyle}>Selected Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              style={{ ...inputStyle, background: '#ffffff' }}
            >
              <option value="">-- Choose Floor --</option>
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.name ? `${fl.name} (Floor ${fl.floor_number})` : `Floor ${fl.floor_number}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Floor Context Banner with Beds Overview */}
        {activeFloorObj && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 211, 105, 0.15) 0%, rgba(250, 171, 54, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                  color: '#060913',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={20} />
              </div>
              <div>
                <div style={{ color: '#78350f', fontWeight: '800', fontSize: '1.05rem' }}>
                  {activeFloorObj.name || `Floor ${activeFloorObj.floor_number}`}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: '600' }}>
                  {activePgObj?.name}
                </div>
              </div>
            </div>

            {/* Quick floor occupancy stats pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  background: '#ffffff',
                  color: '#060913',
                  border: '1px solid #e2e8f0',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Tag size={13} color="#d97706" />
                {rooms.length} Room{rooms.length !== 1 ? 's' : ''}
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  background: '#ffffff',
                  color: '#060913',
                  border: '1px solid #e2e8f0',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <BedIcon size={14} color="#3b82f6" />
                {totalBedsCount} Total Beds
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                }}
              >
                ● {occupiedBedsCount} Occupied
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                }}
              >
                ● {availableBedsCount} Available
              </span>
            </div>
          </div>
        )}

        {/* Floor Switcher Tabs */}
        {floors.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Switch Floor:</label>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {floors.map((fl) => {
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
                    🏢 {fl.name || `Floor ${fl.floor_number}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rooms & Nested Beds Grid */}
        {selectedFloor ? (
          <>
            {loading ? (
              <div style={{ color: '#060913', padding: '3rem 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <RefreshCw size={20} className="spin" /> Loading rooms and occupancy...
              </div>
            ) : rooms.length === 0 ? (
              <div
                style={{
                  background: 'var(--gradient-card)',
                  border: '1px dashed #e2e8f0',
                  borderRadius: '16px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  color: '#060913',
                }}
              >
                <Layers size={44} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Rooms on this Floor</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                  Get started by adding rooms to <strong>{activeFloorObj?.name || `Floor ${activeFloorObj?.floor_number}`}</strong>.
                </p>
                <button
                  onClick={() => setShowRoomModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                    color: '#060913',
                    border: 'none',
                    padding: '0.65rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Add First Room
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {rooms.map((room) => {
                  const maxCap = ROOM_CAPACITY_LIMITS[room.room_type] || 50;
                  const roomBeds = room.beds || [];
                  const isFull = roomBeds.length >= maxCap;
                  const occupiedCount = roomBeds.filter((b) => b.status === 'OCCUPIED').length;

                  return (
                    <div
                      key={room.id}
                      className="card-animated"
                      style={{
                        background: 'var(--gradient-card)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1.4rem',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Room Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '800', color: '#060913', fontSize: '1.25rem' }}>
                                Room {room.room_number}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  color: statusColor(room.status),
                                  background: `${statusColor(room.status)}18`,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {room.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '700', marginTop: '0.2rem' }}>
                              {room.room_type?.replace(/_/g, ' ')}
                            </div>
                          </div>

                          {/* Capacity Badge */}
                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: '700',
                                color: isFull ? '#ef4444' : '#10b981',
                                background: isFull ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                                display: 'inline-block',
                              }}
                            >
                              {roomBeds.length} / {maxCap} Beds {isFull ? '(Max)' : ''}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {occupiedCount} Occupied
                            </div>
                          </div>
                        </div>

                        {room.description && (
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
                            {room.description}
                          </div>
                        )}

                        {/* Beds Section Divider */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: '1rem 0 0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BedIcon size={16} color="#d97706" /> Beds in Room ({roomBeds.length})
                          </div>
                          {!isFull && (
                            <button
                              onClick={() => openAddBedModal(room)}
                              style={{
                                background: 'rgba(255, 211, 105, 0.2)',
                                color: '#b45309',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Plus size={12} /> Add Bed
                            </button>
                          )}
                        </div>

                        {/* Beds List */}
                        {roomBeds.length === 0 ? (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '10px',
                              padding: '1.2rem',
                              textAlign: 'center',
                              color: '#64748b',
                              fontSize: '0.85rem',
                            }}
                          >
                            <BedIcon size={24} style={{ opacity: 0.5, marginBottom: '0.35rem' }} />
                            <div>No beds added yet</div>
                            <button
                              onClick={() => openAddBedModal(room)}
                              style={{
                                marginTop: '0.5rem',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                color: '#060913',
                                cursor: 'pointer',
                              }}
                            >
                              + Add Bed to Room
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {roomBeds.map((bed) => {
                              const activeAlloc = bed.allocations?.[0];
                              const resident = activeAlloc?.resident;
                              const isOccupied = bed.status === 'OCCUPIED';

                              return (
                                <div
                                  key={bed.id}
                                  onClick={() => handleBedClick(bed, room)}
                                  style={{
                                    background: isOccupied
                                      ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)'
                                      : '#ffffff',
                                    border: isOccupied ? '1px solid #fecaca' : '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    padding: '0.75rem 0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = isOccupied ? '#ef4444' : '#f59e0b';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isOccupied ? '#fecaca' : '#e2e8f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                                  }}
                                >
                                  {/* Top Row: Bed name & status pill */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <div
                                        style={{
                                          width: '26px',
                                          height: '26px',
                                          borderRadius: '6px',
                                          background: isOccupied ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                          color: isOccupied ? '#ef4444' : '#10b981',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: '800',
                                        }}
                                      >
                                        <BedIcon size={14} />
                                      </div>
                                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#060913' }}>
                                        {bed.bed_number && /^bed[\s-]?/i.test(bed.bed_number.trim()) ? bed.bed_number : `Bed ${bed.bed_number}`}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: '700',
                                          color: statusColor(bed.status),
                                          background: `${statusColor(bed.status)}18`,
                                          padding: '0.15rem 0.5rem',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        {bed.status}
                                      </span>

                                      {/* Quick edit/delete actions */}
                                      <button
                                        onClick={(e) => openEditBedModal(room, bed, e)}
                                        title="Edit Bed"
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#94a3b8',
                                          cursor: 'pointer',
                                          padding: '2px',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#060913')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                                      >
                                        <Edit size={13} />
                                      </button>
                                      {!isOccupied && (
                                        <button
                                          onClick={(e) => handleDeleteBed(bed.id, e)}
                                          title="Delete Bed"
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            padding: '2px',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Occupant Card if Occupied */}
                                  {isOccupied && resident ? (
                                    <div
                                      style={{
                                        marginTop: '0.5rem',
                                        padding: '0.5rem 0.65rem',
                                        background: '#ffffff',
                                        border: '1px solid #fee2e2',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                        <div
                                          style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                                            color: '#060913',
                                            fontWeight: '800',
                                            fontSize: '0.78rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                          }}
                                        >
                                          {resident.profile_photo_url ? (
                                            <img
                                              src={
                                                resident.profile_photo_url.startsWith('http')
                                                  ? resident.profile_photo_url
                                                  : `${BACKEND_URL}${resident.profile_photo_url}`
                                              }
                                              alt={resident.full_name}
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            resident.full_name?.[0]?.toUpperCase() || 'R'
                                          )}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#060913' }}>
                                            {resident.full_name}
                                          </div>
                                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                            {resident.phone || 'No phone'}
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          fontSize: '0.72rem',
                                          color: '#ef4444',
                                          fontWeight: '700',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.2rem',
                                          background: 'rgba(239, 68, 68, 0.08)',
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <User size={12} /> View Details
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        marginTop: '0.4rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.78rem',
                                        color: '#64748b',
                                      }}
                                    >
                                      <span>
                                        Rent: <strong style={{ color: '#10b981' }}>₹{bed.default_rent || 0}</strong>/mo
                                      </span>
                                      {Number(bed.default_security_deposit) > 0 && (
                                        <span>Deposit: ₹{bed.default_security_deposit}</span>
                                      )}
                                      <span style={{ color: '#10b981', fontWeight: '600' }}>Ready for Resident</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              background: 'var(--gradient-card)',
              border: '1px dashed #e2e8f0',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
              color: '#060913',
            }}
          >
            Please select a floor above to view or configure rooms and beds.
          </div>
        )}
      </div>

      {/* Resident Details Modal */}
      {selectedResidentDetail && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedResidentDetail(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-pop-in"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedResidentDetail(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.8rem',
                  color: '#060913',
                  boxShadow: '0 8px 20px rgba(255, 211, 105, 0.4)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {selectedResidentDetail.resident.profile_photo_url ? (
                  <img
                    src={
                      selectedResidentDetail.resident.profile_photo_url.startsWith('http')
                        ? selectedResidentDetail.resident.profile_photo_url
                        : `${BACKEND_URL}${selectedResidentDetail.resident.profile_photo_url}`
                    }
                    alt={selectedResidentDetail.resident.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  selectedResidentDetail.resident.full_name?.[0]?.toUpperCase() || 'R'
                )}
              </div>

              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#060913' }}>
                  {selectedResidentDetail.resident.full_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                    }}
                  >
                    ● {selectedResidentDetail.resident.status || 'ACTIVE'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#b45309',
                      background: 'rgba(255, 211, 105, 0.25)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                    }}
                  >
                    Room {selectedResidentDetail.room.room_number} • {selectedResidentDetail.bed.bed_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Room & Allocation Highlight Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.85rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Monthly Rent
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981', marginTop: '0.15rem' }}>
                  ₹{Number(selectedResidentDetail.allocation.monthly_rent || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Security Deposit
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#060913', marginTop: '0.15rem' }}>
                  ₹{Number(selectedResidentDetail.allocation.security_deposit || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Check-in Date
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#060913', marginTop: '0.15rem' }}>
                  {selectedResidentDetail.allocation.check_in_date || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  Floor & PG
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#060913', marginTop: '0.15rem' }}>
                  {selectedResidentDetail.floor?.name || `Floor ${selectedResidentDetail.floor?.floor_number}`} ({activePgObj?.name})
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#060913', marginBottom: '0.65rem' }}>
                Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <a
                  href={`tel:${selectedResidentDetail.resident.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#060913',
                  }}
                >
                  <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.4rem', borderRadius: '8px' }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Phone</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700' }}>{selectedResidentDetail.resident.phone || 'N/A'}</div>
                  </div>
                </a>

                <a
                  href={`mailto:${selectedResidentDetail.resident.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#060913',
                  }}
                >
                  <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.4rem', borderRadius: '8px' }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Email</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedResidentDetail.resident.email || 'N/A'}
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Emergency & Personal Info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#060913', marginBottom: '0.65rem' }}>
                Personal & Emergency Details
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'grid', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Emergency Contact:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>
                    {selectedResidentDetail.resident.emergency_contact_name || 'N/A'}{' '}
                    {selectedResidentDetail.resident.emergency_contact_phone && `(${selectedResidentDetail.resident.emergency_contact_phone})`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Occupation:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>
                    {selectedResidentDetail.resident.occupation || 'N/A'}{' '}
                    {selectedResidentDetail.resident.company_or_college && `@ ${selectedResidentDetail.resident.company_or_college}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>City / Hometown:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>
                    {[selectedResidentDetail.resident.city, selectedResidentDetail.resident.state].filter(Boolean).join(', ') || 'N/A'}
                  </span>
                </div>
                {selectedResidentDetail.allocation.notes && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', color: '#475569', fontSize: '0.82rem' }}>
                    <strong>Allocation Notes:</strong> {selectedResidentDetail.allocation.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedResidentDetail(null);
                  navigate('/residents');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#060913',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <User size={15} /> All Residents <ExternalLink size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedResidentDetail(null);
                  navigate('/allocations');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                  border: 'none',
                  color: '#060913',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
                }}
              >
                <Shield size={15} /> Manage Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Bed Modal */}
      {showBedModal && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowBedModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-pop-in"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#060913' }}>
                  {editingBed ? 'Edit Bed Details' : 'Add Bed to Room'}
                </h2>
                <div style={{ color: '#d97706', fontSize: '0.82rem', fontWeight: '700', marginTop: '0.2rem' }}>
                  Room {targetRoomForBed?.room_number} ({targetRoomForBed?.room_type?.replace(/_/g, ' ')})
                </div>
              </div>
              <button
                onClick={() => setShowBedModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#060913', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleBedSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Bed Identifier / Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed-1A, Bed-1, or Window Side"
                  value={bedForm.bed_number}
                  onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Bed Status</label>
                <select
                  value={bedForm.status}
                  onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for check-in)</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Default Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={bedForm.default_rent}
                    onChange={(e) => setBedForm({ ...bedForm, default_rent: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={bedForm.default_security_deposit}
                    onChange={(e) => setBedForm({ ...bedForm, default_security_deposit: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Window side, premium mattress..."
                  value={bedForm.description}
                  onChange={(e) => setBedForm({ ...bedForm, description: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBedModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    color: '#060913',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                    color: '#060913',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
                  }}
                >
                  {submitting ? 'Saving...' : editingBed ? 'Update Bed' : 'Create Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floor Modal */}
      {showFloorModal && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowFloorModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-pop-in"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Add New Floor</h2>
                <p style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.2rem' }}>
                  For: {activePgObj?.name}
                </p>
              </div>
              <button
                onClick={() => setShowFloorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div
                style={{
                  color: '#f87171',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid #ef4444',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleFloorSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Floor Number *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  style={inputStyle}
                  value={floorForm.floor_number}
                  onChange={(e) => setFloorForm((f) => ({ ...f, floor_number: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Floor Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Floor / Executive Wing"
                  style={inputStyle}
                  value={floorForm.name}
                  onChange={(e) => setFloorForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowFloorModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    color: '#060913',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                    color: '#060913',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowRoomModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="animate-pop-in"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '450px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Add New Room</h2>
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.12)',
                    color: '#d97706',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    display: 'inline-block',
                    marginTop: '0.3rem',
                  }}
                >
                  Floor: {activeFloorObj?.name || `Floor ${activeFloorObj?.floor_number}`} ({activePgObj?.name})
                </div>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div
                style={{
                  color: '#f87171',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid #ef4444',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}
            <form onSubmit={handleRoomSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or 1A"
                  style={inputStyle}
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm((f) => ({ ...f, room_number: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Room Type *</label>
                <select
                  required
                  style={inputStyle}
                  value={roomForm.room_type}
                  onChange={(e) => setRoomForm((f) => ({ ...f, room_type: e.target.value }))}
                >
                  <option value="SINGLE">Single (1 Bed)</option>
                  <option value="DOUBLE_SHARING">Double Sharing (2 Beds)</option>
                  <option value="TRIPLE_SHARING">Triple Sharing (3 Beds)</option>
                  <option value="FOUR_SHARING">4 Sharing (4 Beds)</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description / Amenities</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Balcony view, attached bathroom, AC..."
                  style={inputStyle}
                  value={roomForm.description}
                  onChange={(e) => setRoomForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    color: '#060913',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                    color: '#060913',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Creating Room...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
