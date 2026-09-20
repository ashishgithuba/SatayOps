import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api.service';
import { Mail, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

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

  const fontStack = "'Source Sans Pro', ui-sans-serif, -apple-system, 'Segoe UI', sans-serif";
  const serifStack = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

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
          {/* Icon + heading */}
          <div style={{
            width: '40px', height: '40px',
            border: '1px solid #DADCD6',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <KeyRound size={18} color="#2C3E8C" strokeWidth={2} />
          </div>

          <h1 style={{
            fontFamily: serifStack,
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#14171F',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
          }}>
            Reset your password
          </h1>
          <p style={{ color: '#5C6068', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 2rem' }}>
            {!submitted
              ? "Enter the email address on your account and we'll send a link to reset your password."
              : null}
          </p>

          {!submitted ? (
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#14171F',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  marginBottom: '0.4rem',
                }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#9CA0A6" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem 0.7rem 2.5rem',
                      background: '#FFFFFF',
                      border: '1px solid #D5D7D1',
                      borderRadius: '4px',
                      color: '#14171F',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2C3E8C';
                      e.target.style.boxShadow = '0 0 0 3px rgba(44,62,140,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D5D7D1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
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
                {loading ? 'Sending link…' : 'Send reset link'}
              </button>

              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                color: '#5C6068', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500',
              }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <ShieldCheck size={18} color="#2C7A4B" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ color: '#3A3D42', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  If an account exists for <strong style={{ color: '#14171F' }}>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.
                </p>
              </div>

              <div style={{
                background: '#F4F5F3',
                border: '1px solid #E3E4DE',
                borderRadius: '4px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
              }}>
                <p style={{ color: '#5C6068', fontSize: '0.8rem', margin: 0, lineHeight: '1.6' }}>
                  The link expires in <strong style={{ color: '#14171F' }}>15 minutes</strong>. Didn't get it? You can request a new one below.
                </p>
              </div>

              <button
                onClick={() => setSubmitted(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #D5D7D1',
                  borderRadius: '4px',
                  color: '#14171F',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                }}
              >
                Use a different email
              </button>

              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                color: '#5C6068', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500',
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