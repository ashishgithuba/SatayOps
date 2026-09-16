import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api.service';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #ffd369, #f59e0b)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 20px rgba(255,211,105,0.3)',
          }}>
            <KeyRound size={28} color="#0f172a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
            Forgot Password?
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Enter your email to receive a reset token
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontWeight: '500',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.9rem 0.8rem 2.6rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,211,105,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: loading ? '#64748b' : 'linear-gradient(135deg, #ffd369, #f59e0b)',
                border: 'none',
                borderRadius: '10px',
                color: '#0f172a',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1.5rem',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
            >
              {loading ? 'Sending...' : 'Send Reset Token'}
            </button>

            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 1.25rem', display: 'block' }} />
            <h3 style={{ color: '#f8fafc', fontWeight: '800', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Check Your Email!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              We've sent a password reset link to <strong style={{ color: '#f8fafc' }}>{email}</strong>.<br />
              Please check your inbox (and spam folder).
            </p>

            <div style={{
              background: 'rgba(255,211,105,0.06)',
              border: '1px solid rgba(255,211,105,0.15)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0, lineHeight: '1.6' }}>
                ⏰ The reset link will expire in <strong style={{ color: '#FFD369' }}>15 minutes</strong>.<br />
                Didn't receive it? Check spam or try again.
              </p>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#94a3b8',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              Try a Different Email
            </button>

            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
