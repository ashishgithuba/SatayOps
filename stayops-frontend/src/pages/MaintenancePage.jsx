import React, { useState, useEffect } from 'react';
import { maintenanceService, residentService, pgService } from '../services/api.service';
import { AlertTriangle, Plus, X, RefreshCw, CheckCircle2, Clock, Wrench, ShieldCheck, Filter } from 'lucide-react';

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

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED, CLOSED
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [statusForm, setStatusForm] = useState({
    status: '',
    note: '',
    resolution_note: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, resRes, pgRes] = await Promise.all([
        maintenanceService.getRequests(),
        residentService.getResidents(),
        pgService.getMyPgs(),
      ]);
      setRequests(reqRes.data || []);
      setResidents(resRes.data || []);
      // Auto-set pg_id context if needed
      if (pgRes.data && pgRes.data.length > 0 && !localStorage.getItem('activePgId')) {
        localStorage.setItem('activePgId', pgRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await maintenanceService.updateStatus(selectedRequest.id, {
        status: statusForm.status,
        note: statusForm.note,
        resolution_note: statusForm.resolution_note,
      });
      showSuccess(`✅ Status updated to ${statusForm.status}!`);
      setShowStatusModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (req) => {
    setSelectedRequest(req);
    setStatusForm({
      status: req.status,
      note: '',
      resolution_note: req.resolution_note || '',
    });
    setError('');
    setShowStatusModal(true);
  };

  const filteredRequests = requests.filter(r => activeTab === 'ALL' || r.status === activeTab);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return '#ef4444'; // Red
      case 'IN_PROGRESS': return '#f59e0b'; // Orange
      case 'RESOLVED': return '#10b981'; // Green
      case 'CLOSED': return '#64748b'; // Gray
      default: return '#060913';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'HIGH') return <span style={{ padding: '0.2rem 0.5rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>HIGH PRIORITY</span>;
    if (priority === 'MEDIUM') return <span style={{ padding: '0.2rem 0.5rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>MEDIUM PRIORITY</span>;
    return <span style={{ padding: '0.2rem 0.5rem', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>LOW PRIORITY</span>;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Maintenance & Complaints</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Track and resolve resident issues efficiently.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#065f46', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} color="#10b981" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((tab) => {
          const count = tab === 'ALL' ? requests.length : requests.filter(r => r.status === tab).length;
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

      {/* List */}
      {loading ? (
        <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
          <RefreshCw size={18} className="spin" /> Loading requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
          <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>All Good!</h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} maintenance requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredRequests.map(req => (
            <div key={req.id} className="card-animated" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(req.status) }}></div>
                  <span style={{ fontWeight: '800', fontSize: '0.8rem', color: getStatusColor(req.status) }}>{req.status.replace('_', ' ')}</span>
                </div>
                {getPriorityBadge(req.priority)}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#060913', marginBottom: '0.25rem' }}>{req.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{req.description}</p>
              
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#64748b' }}>Resident:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>{req.resident?.full_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#64748b' }}>Category:</span>
                  <span style={{ fontWeight: '700', color: '#060913' }}>{req.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Created:</span>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button onClick={() => openStatusModal(req)} style={{ width: '100%', padding: '0.65rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#060913', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                <Wrench size={14} /> Update Status
              </button>
            </div>
          ))}
        </div>
      )}


      {/* Update Status Modal */}
      {showStatusModal && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setShowStatusModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div className="animate-pop-in" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#060913', marginBottom: '1.25rem' }}>Update Status</h2>
            
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>New Status *</label>
                <select value={statusForm.status} onChange={(e) => setStatusForm({...statusForm, status: e.target.value})} style={inputStyle}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Update Note (Internal)</label>
                <input type="text" placeholder="e.g. Plumber called, will arrive tomorrow" value={statusForm.note} onChange={(e) => setStatusForm({...statusForm, note: e.target.value})} style={inputStyle} />
              </div>

              {statusForm.status === 'RESOLVED' && (
                <div>
                  <label style={labelStyle}>Resolution Note (For Resident) *</label>
                  <textarea required placeholder="What was done to fix it?" value={statusForm.resolution_note} onChange={(e) => setStatusForm({...statusForm, resolution_note: e.target.value})} style={{...inputStyle, minHeight: '80px'}} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>{submitting ? 'Updating...' : 'Save Status'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
