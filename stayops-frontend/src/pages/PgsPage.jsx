import React, { useState, useEffect } from 'react';
import { pgService } from '../services/api.service';
import { Building2, Plus, MapPin, Phone, Mail, CheckCircle2, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function PgsPage() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 8 });

  const [formData, setFormData] = useState({
    name: '',
    gender_type: 'MALE',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    contact_phone: '',
    contact_email: '',
    description: '',
  });

  const fetchPgs = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await pgService.getMyPgs({ page: targetPage, limit });
      setPgs(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch PGs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPgs(page);
  }, [page]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await pgService.createPg(formData);
      setSuccessMsg('PG Property created successfully!');
      setFormData({
        name: '',
        gender_type: 'MALE',
        address_line: '',
        city: '',
        state: '',
        pincode: '',
        contact_phone: '',
        contact_email: '',
        description: '',
      });
      setShowModal(false);
      setPage(1);
      fetchPgs(1);
    } catch (err) {
      setError(err.message || 'Failed to create PG. Please verify input fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAddress = (pg) => {
    const mainAddr = pg.address_line || pg.address || '';
    const parts = [mainAddr, pg.city, pg.state, pg.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };

  return (
    // IMPORTANT: using a Fragment (<>...</>) here instead of one big wrapping
    // <div>. The old code put the modal INSIDE `<div className="animate-fade-in">`.
    // That class runs a CSS animation with `animation-fill-mode: forwards`,
    // whose final keyframe sets `transform: translateY(0)`. Even though that
    // looks like "no movement", `translateY(0)` is still a transform value
    // (not `none`), and CSS spec says ANY non-none transform on an ancestor
    // creates a new "containing block" for `position: fixed` descendants.
    // So the modal was being confined to `.animate-fade-in`'s box instead of
    // the real viewport -- that's exactly why it looked clipped.
    // Fix: keep the modal as a SIBLING of `.animate-fade-in`, not a child.
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913', letterSpacing: '-0.02em' }}>
              PG Properties Directory
            </h1>
            <p style={{ color: '#060913', fontSize: '0.95rem', marginTop: '0.2rem' }}>
              Manage your hostel properties, total floors, and location addresses.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
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
            <Plus size={18} /> Add New PG Property
          </button>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* PG Cards List */}
        {loading ? (
          <div style={{ color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
            <RefreshCw size={18} className="spin" /> Loading properties...
          </div>
        ) : pgs.length === 0 ? (
          <div
            style={{
              background: 'var(--gradient-card)',
              border: '1px dashed #e2e8f0',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: '#060913',
            }}
          >
            <Building2 size={48} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No PG Properties Found</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click on "Add New PG Property" to get started.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
                color: '#060913',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: '800',
                boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
              }}
            >
              Create Your First PG
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
              {pgs.map((pg) => (
                <div
                  key={pg.id}
                  className="card-animated"
                  style={{
                    background: 'var(--gradient-card)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.6rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.6rem', borderRadius: '10px', color: '#818cf8' }}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#060913' }}>{pg.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#060913', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <MapPin size={16} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{formatAddress(pg)}</span>
                      </div>
                      {pg.contact_phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={16} color="#818cf8" />
                          <span>{pg.contact_phone}</span>
                        </div>
                      )}
                      {pg.contact_email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={16} color="#818cf8" />
                          <span>{pg.contact_email}</span>
                        </div>
                      )}
                    </div>

                    {pg.description && (
                      <p style={{ fontSize: '0.85rem', color: '#060913', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                        {pg.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Bar */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '2rem', background: 'var(--gradient-card)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#060913', fontSize: '0.88rem' }}>
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total PGs)
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ padding: '0.45rem 0.9rem', background: pagination.page <= 1 ? '#f1f5f9' : '#374151', color: pagination.page <= 1 ? '#94a3b8' : '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      style={{ padding: '0.45rem 0.8rem', background: pNum === pagination.page ? 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)' : '#f1f5f9', color: pNum === pagination.page ? '#060913' : '#475569', borderRadius: '8px', fontWeight: pNum === pagination.page ? '800' : '600', fontSize: '0.85rem', boxShadow: pNum === pagination.page ? '0 4px 12px rgba(255, 211, 105, 0.4)' : 'none' }}
                    >
                      {pNum}
                    </button>
                  ))}
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    style={{ padding: '0.45rem 0.9rem', background: pagination.page >= pagination.totalPages ? '#f1f5f9' : '#374151', color: pagination.page >= pagination.totalPages ? '#94a3b8' : '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Creating New PG Property
          Placed as a SIBLING of the `.animate-fade-in` div above (both are
          children of the top-level Fragment), NOT nested inside it. This is
          the actual fix -- see comment above. */}
      {showModal && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
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
            overflowX: 'hidden',
          }}
        >
          <div
            className="animate-pop-in"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Add New PG Property</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: '#060913', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>PG Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. StayOps Executive PG"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PG Type (Gender) *</label>
                  <select
                    name="gender_type"
                    value={formData.gender_type}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  >
                    <option value="MALE">Male PG</option>
                    <option value="FEMALE">Female PG</option>
                    <option value="CO_LIVING">Co-Living (Mixed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Address *</label>
                <input
                  type="text"
                  name="address_line"
                  value={formData.address_line}
                  onChange={handleChange}
                  required
                  placeholder="Street / Building No."
                  style={inputStyle}
                />
              </div>

              <div className="responsive-grid-3">
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="City"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="Contact Number"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="Contact Email"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional details about facilities..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #e2e8f0', color: '#060913', borderRadius: '8px', fontWeight: '600' }}
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
                    borderRadius: '8px',
                    fontWeight: '800',
                    boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create PG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
