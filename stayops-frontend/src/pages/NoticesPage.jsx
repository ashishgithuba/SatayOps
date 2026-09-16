import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { noticeService, floorService, roomService, pgService } from '../services/api.service';
import { Megaphone, Plus, X, RefreshCw, CheckCircle2, FileText, Send, Trash2, CalendarClock } from 'lucide-react';

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

export default function NoticesPage() {
  const { user } = useAuth();
  const isResident = user?.role === 'RESIDENT';

  const [pgs, setPgs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, DRAFT, PUBLISHED, EXPIRED
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    target_type: 'ALL_RESIDENTS',
    target_ids: [],
  });

  // Separate ref to track publish intent without async state issues
  const [activePgId, setActivePgId] = useState(null);
  const publishRef = React.useRef('DRAFT');

  // Step 1: On mount, get PG list and pick first PG
  useEffect(() => {
    if (isResident) return; // Residents don't need to load the admin PG dropdown list
    pgService.getMyPgs().then(res => {
      const pgList = res.data || [];
      setPgs(pgList);
      if (pgList.length > 0) {
        setActivePgId(pgList[0].id);
      }
    }).catch(console.error);
  }, [isResident]);

  // Step 2: When activePgId is known (or user is resident), fetch notices + floors
  useEffect(() => {
    if (isResident) {
      setLoading(true);
      noticeService.getNotices({ status: 'PUBLISHED' })
        .then(res => setNotices(res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
      return;
    }

    if (!activePgId) return;
    setLoading(true);
    Promise.all([
      noticeService.getNotices({ pg_id: activePgId }),
      floorService.getFloorsByPg(activePgId),
    ]).then(([noticesRes, floorsRes]) => {
      setNotices(noticesRes.data || []);
      setFloors(floorsRes.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [activePgId, isResident]);

  const fetchNotices = () => {
    if (!activePgId) return;
    noticeService.getNotices({ pg_id: activePgId })
      .then(res => setNotices(res.data || []))
      .catch(console.error);
  };

  const fetchRoomsForFloor = async (floorId) => {
    if (!floorId) return;
    setRooms([]);
    try {
      const res = await roomService.getRoomsByFloor(floorId);
      const roomList = res.data || [];
      setRooms(roomList);
      if (roomList.length === 0) {
        setError('No rooms found for this floor. Please add rooms first.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('fetchRoomsForFloor error:', err);
      setError(err?.message || 'Failed to load rooms for this floor');
      setTimeout(() => setError(''), 3000);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreateNotice = async (e, publishStatus) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const status = publishRef.current || 'DRAFT';
    try {
      if (!activePgId) throw new Error('No active PG found');

      await noticeService.createNotice({
        ...formData,
        pg_id: activePgId,
        status,
      });

      showSuccess(`✅ Notice ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
      setShowAddModal(false);
      setFormData({ title: '', description: '', type: 'GENERAL', priority: 'NORMAL', target_type: 'ALL_RESIDENTS', target_ids: [] });
      publishRef.current = 'DRAFT';
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to create notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await noticeService.updateNoticeStatus(id, { status: 'PUBLISHED', target_ids: [] });
      showSuccess('✅ Notice published live!');
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to publish');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await noticeService.deleteNotice(id);
      showSuccess('🗑️ Notice deleted');
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const filteredNotices = notices.filter(n => 
    isResident ? n.status === 'PUBLISHED' : (activeTab === 'ALL' || n.status === activeTab)
  );

  const getTypeBadge = (type) => {
    switch (type) {
      case 'MAINTENANCE': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>🔧 MAINTENANCE</span>;
      case 'PAYMENT': return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>💸 PAYMENT</span>;
      case 'EMERGENCY': return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>🚨 EMERGENCY</span>;
      case 'EVENT': return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>🎉 EVENT</span>;
      default: return <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>📢 GENERAL</span>;
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Notices & Announcements</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Broadcast messages, alerts, and rules to residents.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!isResident && pgs.length > 0 && (
            <select
              value={activePgId || ''}
              onChange={(e) => setActivePgId(e.target.value)}
              style={{ ...inputStyle, width: '220px', background: '#fff' }}
            >
              {pgs.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </select>
          )}
          
          {!isResident && (
            <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #060913, #1e293b)', color: '#ffd369', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', height: '42px' }}>
              <Megaphone size={18} /> Create Notice
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#065f46', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} color="#10b981" /> {successMsg}
        </div>
      )}

      {/* Tabs - Only show for Admin */}
      {!isResident && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'DRAFT', 'PUBLISHED', 'EXPIRED'].map((tab) => {
            const count = tab === 'ALL' ? notices.length : notices.filter(n => n.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  border: '1px solid',
                  borderColor: isActive ? 'transparent' : '#e2e8f0',
                  background: isActive ? '#060913' : '#fff',
                  color: isActive ? '#ffd369' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {tab.replace('_', ' ')}
                <span style={{ background: isActive ? 'rgba(255,255,255,0.15)' : '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
          <RefreshCw size={18} className="spin" /> Loading notices...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
          <Megaphone size={48} color="#94a3b8" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No Notices Found</h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Create a notice to keep your residents informed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredNotices.map(notice => (
            <div key={notice.id} className="card-animated" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: notice.status === 'PUBLISHED' ? '#10b981' : notice.status === 'DRAFT' ? '#f59e0b' : '#64748b' }}></div>
                  <span style={{ fontWeight: '800', fontSize: '0.8rem', color: notice.status === 'PUBLISHED' ? '#10b981' : notice.status === 'DRAFT' ? '#f59e0b' : '#64748b' }}>{notice.status}</span>
                </div>
                {getTypeBadge(notice.type)}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#060913', marginBottom: '0.25rem' }}>{notice.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{notice.description}</p>
              
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#64748b' }}>Target:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>{notice.target_type.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{new Date(notice.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              
              {!isResident && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {notice.status === 'DRAFT' && (
                    <button onClick={() => handlePublish(notice.id, notice.target_type)} style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                      <Send size={14} /> Publish Now
                    </button>
                  )}
                  <button onClick={() => handleDelete(notice.id)} style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: notice.status === 'DRAFT' ? 'none' : 1 }}>
                    <Trash2 size={16} /> {notice.status !== 'DRAFT' && 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Add Notice Modal */}
      {showAddModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#060913' }}>Create Announcement</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleCreateNotice} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Notice Title *</label>
                <input required type="text" placeholder="e.g. Water Supply Interruption" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Message / Description *</label>
                <textarea required placeholder="Write the announcement..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={inputStyle}>
                    <option value="GENERAL">General</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="RULE">PG Rule</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority *</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={inputStyle}>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Target Audience *</label>
                <select value={formData.target_type} onChange={(e) => setFormData({...formData, target_type: e.target.value, target_ids: []})} style={inputStyle}>
                  <option value="ALL_RESIDENTS">All Residents</option>
                  <option value="FLOOR">Specific Floor</option>
                  <option value="ROOM">Specific Room</option>
                </select>
              </div>

              {formData.target_type === 'FLOOR' && (
                <div>
                  <label style={labelStyle}>Select Floor *</label>
                  <select
                    required
                    defaultValue=""
                    onChange={(e) => setFormData({...formData, target_ids: [e.target.value]})}
                    style={inputStyle}
                  >
                    <option value="" disabled>Choose a floor...</option>
                    {floors.length === 0 && <option disabled>No floors found</option>}
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>
                        Floor {f.floor_number} {f.name ? `- ${f.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.target_type === 'ROOM' && (
                <div>
                  <label style={labelStyle}>Step 1: Select Floor *</label>
                  <select
                    required
                    defaultValue=""
                    onChange={(e) => { setRooms([]); fetchRoomsForFloor(e.target.value); }}
                    style={{...inputStyle, marginBottom: '0.75rem'}}
                  >
                    <option value="" disabled>Choose a floor...</option>
                    {floors.length === 0 && <option disabled>No floors found</option>}
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>
                        Floor {f.floor_number} {f.name ? `- ${f.name}` : ''}
                      </option>
                    ))}
                  </select>

                  {rooms.length > 0 && (
                    <>
                      <label style={labelStyle}>Step 2: Select Room *</label>
                      <select
                        required
                        defaultValue=""
                        onChange={(e) => setFormData({...formData, target_ids: [e.target.value]})}
                        style={inputStyle}
                      >
                        <option value="" disabled>Choose a room...</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>Room {r.room_number}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={() => { publishRef.current = 'DRAFT'; }}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={() => { publishRef.current = 'PUBLISHED'; }}
                  style={{ flex: 1.5, padding: '0.75rem', background: '#060913', color: '#ffd369', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                >
                  {submitting ? 'Publishing...' : 'Publish Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
