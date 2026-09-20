import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/api.service';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Plus, X, CheckCircle } from 'lucide-react';

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

export default function ResidentMaintenancePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ELECTRICAL',
    priority: 'NORMAL',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      if (!user?.id) return;
      const res = await maintenanceService.getRequests({});
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load maintenance requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await maintenanceService.createRequest({ ...formData });
      setMsg({ text: 'Maintenance request submitted successfully.', type: 'success' });
      setShowAddModal(false);
      setFormData({ title: '', description: '', category: 'ELECTRICAL', priority: 'NORMAL' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':        return { bg: '#fef3c7', color: '#b45309' };
      case 'IN_PROGRESS': return { bg: '#e0e7ff', color: '#4338ca' };
      case 'RESOLVED':    return { bg: '#dcfce7', color: '#15803d' };
      case 'CLOSED':      return { bg: '#f3f4f6', color: '#4b5563' };
      default:            return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading requests...</div>;

  return (
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#0f172a' }}>Maintenance Requests</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Track and submit your repair issues.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
              color: '#060913',
              border: 'none',
              padding: '0.65rem 1.1rem',
              borderRadius: '9px',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 8px 20px rgba(255,211,105,0.35)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* Success Message */}
        {msg.text && (
          <div style={{ background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
            {msg.text}
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div style={{ background: 'var(--gradient-card)', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.5rem' }}>No Maintenance Issues!</h3>
            <p>Everything seems fine. Raise a request if you face any issues.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {requests.map(req => {
              const statusStyle = getStatusColor(req.status);
              return (
                <div key={req.id} className="card-animated" style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.4rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {req.status?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem' }}>{req.title}</h3>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '0.85rem', lineHeight: '1.5' }}>{req.description}</p>
                  <div style={{ background: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', gap: '1.5rem' }}>
                    <div>
                      <div style={{ color: '#94a3b8', marginBottom: '0.15rem' }}>Category</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.category}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', marginBottom: '0.15rem' }}>Priority</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.priority}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Request Modal — matches Add Room design from RoomsPage */}
      {showAddModal && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Raise Maintenance Issue</h2>
                <div style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', display: 'inline-block', marginTop: '0.3rem' }}>
                  <Wrench size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                  We'll get it resolved for you
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', padding: '0.65rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Issue Title *</label>
                <input
                  type="text" required
                  placeholder="e.g. Broken tap in bathroom"
                  style={inputStyle}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  required rows={3}
                  placeholder="Describe the issue in detail..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select required style={inputStyle} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CARPENTRY">Carpentry</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="APPLIANCE">Appliance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Priority *</label>
                <select required style={inputStyle} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', border: 'none', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255,211,105,0.35)', cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
