import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api.service';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Invalid or expired reset token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fontStack = "'Source Sans Pro', ui-sans-serif, -apple-system, 'Segoe UI', sans-serif";
  const serifStack = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 2.6rem 0.7rem 2.5rem',
    background: '#FFFFFF',
    border: '1px solid #D5D7D1',
    borderRadius: '4px',
    color: '#14171F',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const focusInput = (e) => {
    e.target.style.borderColor = '#2C3E8C';
    e.target.style.boxShadow = '0 0 0 3px rgba(44,62,140,0.12)';
  };
  const blurInput = (e) => {
    e.target.style.borderColor = '#D5D7D1';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F5F3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: fontStack,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#FFFFFF',
        border: '1px solid #E3E4DE',
        borderRadius: '4px',
        boxShadow: '0 1px 2px rgba(20,23,31,0.04), 0 8px 24px rgba(20,23,31,0.06)',
        overflow: 'hidden',
      }}>
        {/* Thin identity bar */}
        <div style={{ height: '4px', background: '#2C3E8C' }} />

        <div style={{ padding: '2.75rem 2.5rem 2.5rem' }}>
          {!success && (
            <>
              <div style={{
                width: '40px', height: '40px',
                border: '1px solid #DADCD6',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem',
              }}>
                <ShieldCheck size={18} color="#2C3E8C" strokeWidth={2} />
              </div>

              <h1 style={{
                fontFamily: serifStack,
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#14171F',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.01em',
              }}>
                Set a new password
              </h1>
              <p style={{ color: '#5C6068', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 2rem' }}>
                Choose a password you haven't used before.
              </p>
            </>
          )}

          {success ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <ShieldCheck size={18} color="#2C7A4B" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ color: '#3A3D42', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  <strong style={{ color: '#14171F' }}>Password updated.</strong> Taking you to login…
                </p>
              </div>

              <Link to="/login" style={{
                display: 'block', textAlign: 'center',
                padding: '0.75rem',
                background: '#2C3E8C',
                borderRadius: '4px', color: '#FFFFFF',
                fontWeight: '600', fontSize: '0.9rem', textDecoration: 'none',
              }}>
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: '#FBF2F2',
                  border: '1px solid #E8C6C6',
                  color: '#9A3B3B',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}>
                  {error}
                </div>
              )}

              {/* New Password */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: '#14171F', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#9CA0A6" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA0A6', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#14171F', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#9CA0A6" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA0A6', padding: 0 }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading ? '#9CA0A6' : '#2C3E8C',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1.5rem',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) e.target.style.background = '#24316F'; }}
                onMouseLeave={(e) => { if (!loading) e.target.style.background = '#2C3E8C'; }}
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>

              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                color: '#5C6068', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500',
              }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}