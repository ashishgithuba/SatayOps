import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api.service';
import { Mail, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';

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
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#06100D',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background:
          'radial-gradient(ellipse 140% 100% at 50% -30%, rgba(180,150,60,0.40) 0%, transparent 60%),' +
          'radial-gradient(ellipse 120% 90% at 50% 120%, rgba(80,150,120,0.25) 0%, transparent 65%),' +
          '#06100D',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '1.25rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 50, background: 'transparent', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #FFD369 0%, #FFC94D 100%)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255,211,105,0.5)',
          }}>
            <Building2 size={18} color="#06100D" />
          </div>
          <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            StayOps
          </span>
        </div>
      </nav>

      {/* Card Wrapper */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '1rem', zIndex: 10,
      }}>
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '460px',
          background: 'rgba(20,20,20,0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          padding: '2.75rem 2.5rem',
          textAlign: 'center',
        }}>

          {!submitted ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(255,211,105,0.12)', border: '1px solid rgba(255,211,105,0.35)',
                  color: '#FFD369', fontSize: '0.7rem', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  padding: '0.3rem 0.8rem', borderRadius: '100px', marginBottom: '1.25rem',
                }}>
                  Password Recovery
                </div>
                <h1 style={{
                  fontSize: '1.9rem', fontWeight: '900', color: '#ffffff',
                  marginBottom: '0.5rem', letterSpacing: '-0.03em',
                }}>
                  Reset your password
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', fontWeight: '500' }}>
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171', padding: '0.75rem 1rem', borderRadius: '12px',
                  fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'left',
                }}>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                      <Mail size={16} color="rgba(255,255,255,0.3)" />
                    </div>
                    <input
                      type="email" required placeholder="resident@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: '#ffffff', fontSize: '0.92rem',
                        fontWeight: '500', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(255,211,105,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '0.95rem',
                    background: loading ? 'rgba(255,211,105,0.5)' : 'linear-gradient(135deg, #FFD369 0%, #FFC94D 100%)',
                    border: 'none', borderRadius: '14px',
                    color: '#06100D', fontSize: '0.95rem', fontWeight: '800',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(255,211,105,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </form>

              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem',
                textDecoration: 'none', fontWeight: '500', marginTop: '1.5rem',
              }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          ) : (
            /* Success State */
            <div>
              <div style={{
                width: '64px', height: '64px', margin: '0 auto 1.5rem',
                background: 'rgba(52,211,153,0.12)', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(52,211,153,0.25)',
              }}>
                <CheckCircle size={28} color="#34d399" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.6rem' }}>
                Check your inbox!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                If an account exists for <strong style={{ color: '#FFD369' }}>{email}</strong>, a reset link is on its way.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '2rem' }}>
                Link expires in 15 minutes. Check spam if you don't see it.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  width: '100%', padding: '0.85rem',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem',
                  fontWeight: '600', cursor: 'pointer', marginBottom: '1rem',
                }}
              >
                Use a different email
              </button>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem',
                textDecoration: 'none', fontWeight: '500',
              }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
