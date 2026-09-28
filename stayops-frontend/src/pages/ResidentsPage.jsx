import React, { useState, useEffect } from 'react';
import { residentService } from '../services/api.service';
import { Users, Plus, X, Phone, Mail, CheckCircle2, RefreshCw, FileText, ExternalLink, Image as ImageIcon, ShieldCheck, XCircle, Edit, Trash2 } from 'lucide-react';
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

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:5000${cleanUrl}`;
};

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    guardian_name: '',
    document_type: 'AADHAAR',
    document_number: '',
    status: 'ACTIVE',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

  const fetchResidents = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await residentService.getResidents({ page: targetPage, limit });
      setResidents(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch residents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents(page);
  }, [page]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingResident(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      emergency_contact: '',
      guardian_name: '',
      document_type: 'AADHAAR',
      document_number: '',
      status: 'ACTIVE',
    });
    setProfilePhoto(null);
    setDocumentFile(null);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (r, e) => {
    if (e) e.stopPropagation();
    setEditingResident(r);
    setFormData({
      name: r.full_name || r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      emergency_contact: r.emergency_contact_phone || r.emergency_contact || '',
      guardian_name: r.father_name || r.guardian_name || '',
      document_type: r.documents?.[0]?.document_type || 'AADHAAR',
      document_number: r.documents?.[0]?.document_number || '',
      status: r.status || 'ACTIVE',
    });
    setProfilePhoto(null);
    setDocumentFile(null);
    setError('');
    setShowModal(true);
  };

  const handleDeleteResident = async (residentId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resident record?')) return;
    try {
      await residentService.deleteResident(residentId);
      if (selectedResident && selectedResident.id === residentId) {
        setSelectedResident(null);
      }
      setSuccessMsg('Resident deleted successfully');
      fetchResidents(page);
    } catch (err) {
      alert(err.message || 'Failed to delete resident');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Phone number regex validation (10 digits starting with 6,7,8,9)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = String(formData.phone || '').trim();
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9 (e.g. 9876543210).');
      return;
    }

    if (formData.emergency_contact) {
      const cleanEmergency = String(formData.emergency_contact).trim();
      if (!phoneRegex.test(cleanEmergency)) {
        setError('Please enter a valid 10-digit emergency contact phone number.');
        return;
      }
    }

    setSubmitting(true);

    const body = new FormData();
    body.append('full_name', formData.name);
    body.append('name', formData.name);
    body.append('phone', cleanPhone);
    body.append('status', formData.status);
    if (formData.email) body.append('email', formData.email);
    if (formData.emergency_contact) {
      body.append('emergency_contact', formData.emergency_contact);
      body.append('emergency_contact_phone', formData.emergency_contact);
    }
    if (formData.guardian_name) {
      body.append('guardian_name', formData.guardian_name);
      body.append('father_name', formData.guardian_name);
    }
    if (formData.document_type) body.append('document_type', formData.document_type);
    if (formData.document_number) body.append('document_number', formData.document_number);
    if (profilePhoto) body.append('profile_photo', profilePhoto);
    if (documentFile) body.append('document_file', documentFile);

    try {
      if (editingResident) {
        await residentService.updateResident(editingResident.id, body);
        setSuccessMsg('Resident profile updated successfully!');
      } else {
        await residentService.createResident(body);
        setSuccessMsg('Resident registered successfully!');
      }
      setShowModal(false);
      fetchResidents(page);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyToggle = async (docId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      await residentService.verifyDocument(docId, !currentStatus);
      setSuccessMsg(`Document status updated to ${!currentStatus ? 'VERIFIED' : 'PENDING'}`);
      fetchResidents(page);
      if (selectedResident) {
        setSelectedResident((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            documents: prev.documents?.map((d) => (d.id === docId ? { ...d, verified: !currentStatus } : d)),
          };
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to update document status');
    }
  };

  return (
    // IMPORTANT: Fragment (<>...</>) used instead of one wrapping <div>.
    // `.animate-fade-in` runs a CSS animation with `animation-fill-mode:
    // forwards`, whose final keyframe sets `transform: translateY(0)`. Any
    // non-none `transform` on an ancestor creates a new containing block for
    // `position: fixed` descendants, so a modal nested inside
    // `.animate-fade-in` gets clipped to that div instead of covering the
    // full viewport (sidebar included). Both modals below are kept as
    // SIBLINGS of `.animate-fade-in`, not children — same fix as
    // PgsPage / RoomsPage / BedsPage.
    <>
      <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header Banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '800', color: '#060913' }}>Resident Directory & Profiles</h1>
            <p style={{ color: '#060913', fontSize: '0.9rem', marginTop: '0.2rem' }}>Manage tenant profiles, contact info, bed allocations, and document verification.</p>
          </div>
          <button
            onClick={openCreateModal}
            style={{
              background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
              color: '#060913',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(255, 211, 105, 0.35)',
            }}
          >
            <Plus size={18} /> Register New Resident
          </button>
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
            {successMsg}
          </div>
        )}

        {/* Resident Grid */}
        {loading ? (
          <div style={{ color: '#060913', padding: '3rem 0', textAlign: 'center' }}>Loading resident directory...</div>
        ) : residents.length === 0 ? (
          <div style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
            <Users size={48} color="#374151" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#060913', marginBottom: '0.5rem' }}>No Residents Registered</h3>
            <p style={{ color: '#060913', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click on "Register New Resident" to add tenants.</p>
            <button onClick={openCreateModal} style={{ background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', color: '#060913', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '800', boxShadow: '0 6px 18px rgba(255, 211, 105, 0.35)' }}>
              Register First Resident
            </button>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Resident</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Contact Info</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Bed Allocation</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => {
                  const allocation = r.current_allocation;
                  const photoUrl = getImageUrl(r.profile_photo_url);

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => setSelectedResident(r)}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={r.full_name || r.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(99,102,241,0.5)' }}
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem', color: '#fff' }}>
                              {(r.full_name || r.name || 'R').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{r.full_name || r.name}</div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Phone size={14} /> {r.phone}
                        </div>
                        {r.email && (
                          <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                            <Mail size={14} /> {r.email}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {allocation ? (
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{allocation.pg?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Room {allocation.room?.room_number} • Bed {String(allocation.bed?.bed_number).replace(/^bed[-_\s]*/i, '')}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600', background: '#fffbeb', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Unallocated</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: r.status === 'ACTIVE' ? '#10b981' : '#64748b', background: r.status === 'ACTIVE' ? '#d1fae5' : '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                          {r.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => openEditModal(r, e)}
                            title="Edit Profile"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4f46e5', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteResident(r.id, e)}
                            title="Delete Resident"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <Pagination
                pagination={{
                  currentPage: pagination.page,
                  totalPages: pagination.totalPages,
                  totalItems: pagination.total,
                  pageSize: pagination.limit
                }}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail Drawer Modal
          Sibling of `.animate-fade-in` above (both are children of the top
          -level Fragment), NOT nested inside it. */}
      {selectedResident && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedResident(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>Resident Profile & ID Proof</h2>
              <button onClick={() => setSelectedResident(null)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {(() => {
              const r = selectedResident;
              const photoUrl = getImageUrl(r.profile_photo_url);
              const docs = r.documents || [];

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={r.full_name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {(r.full_name || 'R').charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>{r.full_name || r.name}</h3>
                      <div style={{ color: '#060913', fontSize: '0.85rem' }}>Phone: {r.phone}</div>
                      {r.email && <div style={{ color: '#060913', fontSize: '0.85rem' }}>Email: {r.email}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div><strong style={{ color: '#060913' }}>Emergency Contact:</strong> {r.emergency_contact_phone || r.emergency_contact || 'N/A'}</div>
                    <div><strong style={{ color: '#060913' }}>Guardian / Father:</strong> {r.father_name || r.guardian_name || 'N/A'}</div>
                    <div><strong style={{ color: '#060913' }}>Account Status:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{r.status || 'ACTIVE'}</span></div>
                  </div>

                  {/* Documents List */}
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#060913', marginBottom: '0.75rem' }}>Submitted Identity Documents</h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {docs.length === 0 ? (
                      <div style={{ color: '#060913', fontSize: '0.88rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>No documents uploaded yet.</div>
                    ) : (
                      docs.map((doc) => {
                        const docImgUrl = getImageUrl(doc.document_url);
                        const isPdf = doc.document_url?.endsWith('.pdf');
                        const isVerified = doc.verified;

                        return (
                          <div key={doc.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div>
                                <span style={{ fontWeight: '700', color: '#818cf8' }}>{doc.document_type}</span>
                                {doc.document_number && <span style={{ marginLeft: '0.5rem', color: '#060913', fontSize: '0.85rem' }}>({doc.document_number})</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isVerified ? '#10b981' : '#f59e0b', background: isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                  {isVerified ? 'VERIFIED' : 'PENDING'}
                                </span>
                                <button
                                  onClick={(e) => handleVerifyToggle(doc.id, isVerified, e)}
                                  style={{
                                    background: isVerified ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isVerified ? '#f87171' : '#34d399',
                                    border: 'none',
                                    padding: '0.25rem 0.55rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  {isVerified ? <XCircle size={13} /> : <ShieldCheck size={13} />}
                                  {isVerified ? 'Unverify' : 'Approve Document'}
                                </button>
                              </div>
                            </div>

                            {docImgUrl ? (
                              <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ fontSize: '0.78rem', color: '#060913', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <ImageIcon size={14} /> Document Preview:
                                </div>
                                {isPdf ? (
                                  <a href={docImgUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: '600', background: '#f8fafc', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <FileText size={16} /> Open PDF Document <ExternalLink size={14} />
                                  </a>
                                ) : (
                                  <div>
                                    <img
                                      src={docImgUrl}
                                      alt="Document Proof"
                                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#000', marginBottom: '0.5rem' }}
                                    />
                                    <a href={docImgUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.82rem', fontWeight: '600' }}>
                                      Open Full Resolution <ExternalLink size={12} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: '#060913', marginTop: '0.4rem' }}>Number registered (No image file attached)</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Registration / Edit Modal
          Also a sibling of `.animate-fade-in`, not nested inside it. */}
      {showModal && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="animate-pop-in" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#060913' }}>{editingResident ? 'Edit Resident Profile' : 'Register New Resident'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#060913', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" style={inputStyle} />
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Phone Number (10 Digits) *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" style={inputStyle} />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>Emergency Contact (10 Digits)</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    maxLength={10}
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Parent/Guardian Phone"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Guardian Name</label>
                  <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Father/Mother Name" style={inputStyle} />
                </div>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>ID Document Type</label>
                  <select name="document_type" value={formData.document_type} onChange={handleChange} style={inputStyle}>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Document Number</label>
                  <input type="text" name="document_number" value={formData.document_number} onChange={handleChange} placeholder="ID Number" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Profile Photo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0])}
                  style={{ ...inputStyle, padding: '0.4rem' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Document Proof Upload (Image or PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  style={{ ...inputStyle, padding: '0.4rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {submitting ? 'Saving...' : editingResident ? 'Update Resident' : 'Register Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}