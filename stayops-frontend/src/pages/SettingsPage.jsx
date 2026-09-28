import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.service';
import { User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, login } = useAuth(); // Need login/setUser to update context if name changes? Actually useAuth might need to refresh, but for now we just show it.
  const isResident = user?.role === 'RESIDENT';

  const [profileData, setProfileData] = useState({ name: '', phone: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      setProfileData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await authService.updateProfile({ name: profileData.name, phone: profileData.phone });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      // Optionally refresh context or local data
    } catch (err) {
      setMessage({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setPasswordLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#0f172a',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '2rem' }}>
        Settings
      </h1>

      {message.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#15803d' : '#b91c1c'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: '600' }}>{message.text}</span>
        </div>
      )}

      {/* Grid Container for Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Profile Section - Visible to both, editable only by Owner */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '8px', color: '#0284c7' }}>
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Profile Information</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{isResident ? 'Your personal details' : 'Update your personal details'}</p>
            </div>
          </div>
          
          <form onSubmit={handleProfileUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  style={{ ...inputStyle, ...(isResident ? { background: '#f8fafc', color: '#94a3b8' } : {}) }}
                  required
                  disabled={isResident}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Phone Number</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  style={{ ...inputStyle, ...(isResident ? { background: '#f8fafc', color: '#94a3b8' } : {}) }}
                  required
                  disabled={isResident}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Email Address {isResident ? '' : '(Cannot be changed)'}</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }}
                />
              </div>
            </div>

            {!isResident && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: '#0f172a', color: '#fff', border: 'none',
                    padding: '0.75rem 1.5rem', borderRadius: '8px',
                    fontWeight: '600', cursor: profileLoading ? 'not-allowed' : 'pointer',
                    opacity: profileLoading ? 0.7 : 1
                  }}
                >
                  <Save size={18} /> {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Password Section - Visible to both Owner and Resident */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '8px', color: '#d97706' }}>
              <Lock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Security</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Update your password</p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordChange}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#0f172a', color: '#fff', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '8px',
                fontWeight: '600', cursor: passwordLoading ? 'not-allowed' : 'pointer',
                opacity: passwordLoading ? 0.7 : 1
              }}
            >
              <Save size={18} /> {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
