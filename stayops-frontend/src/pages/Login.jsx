import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, ArrowRight, Building2, Eye, EyeOff, Shield,
} from 'lucide-react';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email address is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setFormError('');
      try {
        await login(values.email, values.password);
        navigate('/dashboard');
      } catch (err) {
        setFormError(err.message || 'Login failed. Please check your credentials.');
      }
    },
  });

  /* ── inline styles ─────────────────────────────────────────────── */
  const S = {
    root: {
      position: 'relative',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#06100D',
    },
    bgLayer: {
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      background:
        'radial-gradient(ellipse 140% 100% at 50% -30%, rgba(180,150,60,0.40) 0%, transparent 60%),' +
        'radial-gradient(ellipse 120% 90% at 50% 120%, rgba(80,150,120,0.25) 0%, transparent 65%),' +
        '#06100D',
    },
    gridOverlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      backgroundImage: 'none',
      backgroundSize: '50px 50px',
    },
    /* Nav — fixed at top so it stays visible while card scrolls */
    nav: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      padding: '1.25rem 2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 50,
      borderBottom: 'none',
      backdropFilter: 'none',
      background: 'transparent',
      boxSizing: 'border-box',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
    },
    logoIcon: {
      width: '36px',
      height: '36px',
      background: 'linear-gradient(135deg, #FFD369 0%, #FFC94D 100%)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(255,211,105,0.5)',
    },
    logoText: {
      color: '#ffffff',
      fontSize: '1.2rem',
      fontWeight: '800',
      letterSpacing: '-0.02em',
    },
    supportBtn: {
      padding: '0.45rem 1rem',
      background: 'rgba(255,211,105,0.1)',
      border: '1px solid rgba(255,211,105,0.3)',
      color: '#FFD369',
      borderRadius: '8px',
      fontSize: '0.82rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    /* Wraps the card. This is the ONLY part of the page that scrolls.
       NOTE: no `alignItems: 'center'` here (that clips the top of
       overflowing content in a scrollable flex container) — the card
       centers itself via `margin: 'auto 0'` instead, which degrades
       gracefully to normal top-aligned scrolling when it doesn't fit. */
    cardWrap: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      overflowY: 'auto',
      paddingTop: 'calc(1.25rem + 36px + 1.25rem)',
      paddingBottom: '8rem',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      boxSizing: 'border-box',
      zIndex: 10,
    },
    /* Card */
    card: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      maxWidth: '460px',
      margin: 'auto 0',
      flexShrink: 0,
      background: 'rgba(20,20,20,0.95)',
      backdropFilter: 'blur(24px)',
      borderRadius: '28px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      padding: '2.75rem 2.5rem',
      textAlign: 'center',
    },
    cardHeader: {
      marginBottom: '2.25rem',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: 'rgba(255,211,105,0.12)',
      border: '1px solid rgba(255,211,105,0.35)',
      color: '#FFD369',
      fontSize: '0.7rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      padding: '0.3rem 0.8rem',
      borderRadius: '100px',
      marginBottom: '1.25rem',
    },
    h1: {
      fontSize: '2rem',
      fontWeight: '900',
      color: '#ffffff',
      marginBottom: '0.5rem',
      letterSpacing: '-0.03em',
    },
    subtitle: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: '0.88rem',
      fontWeight: '500',
    },
    /* Form */
    form: {
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    },
    fieldWrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    },
    label: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '0.75rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    },
    inputWrap: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      display: 'flex',
    },
    input: {
      width: '100%',
      padding: '0.85rem 1rem 0.85rem 2.85rem',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '0.92rem',
      fontWeight: '500',
      outline: 'none',
      transition: 'border-color 0.2s, background 0.2s',
      boxSizing: 'border-box',
    },
    inputError: {
      borderColor: 'rgba(248,113,113,0.6)',
    },
    eyeBtn: {
      position: 'absolute',
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.35)',
      cursor: 'pointer',
      display: 'flex',
      padding: 0,
    },
    passLabelRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    forgotLink: {
      color: '#FFD369',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    fieldErrorText: {
      color: '#f87171',
      fontSize: '0.78rem',
      fontWeight: '700',
      marginLeft: '0.15rem',
      overflow: 'hidden',
    },
    errorBox: {
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.35)',
      color: '#f87171',
      padding: '0.75rem 1rem',
      borderRadius: '10px',
      fontSize: '0.85rem',
      fontWeight: '600',
    },
    submitBtn: {
      width: '100%',
      padding: '0.95rem',
      background: 'linear-gradient(135deg, #FFD369 0%, #FFC94D 100%)',
      color: '#0F0F0F',
      borderRadius: '12px',
      fontWeight: '900',
      fontSize: '0.95rem',
      border: 'none',
      boxShadow: '0 8px 24px rgba(255,211,105,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '0.5rem',
    },
    footerText: {
      marginTop: '1.75rem',
      color: 'rgba(255,255,255,0.3)',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    /* Page Footer — fixed at bottom so it stays visible while card scrolls */
    pageFooter: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      padding: '1.5rem 2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      zIndex: 999,
      background: 'transparent',
      boxSizing: 'border-box',
    },
    footerBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    footerDot: {
      width: '18px',
      height: '18px',
      background: 'linear-gradient(135deg, #FFD369, #FFC94D)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerBrandText: {
      color: 'rgba(255,211,105,0.7)',
      fontSize: '0.65rem',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    avatarRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    avatarMore: {
      width: '26px',
      height: '26px',
      borderRadius: '50%',
      border: '2px solid #0F0F0F',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: '0.55rem',
      fontWeight: '900',
      marginLeft: '-8px',
    },
    footerLinks: {
      display: 'flex',
      gap: '1.5rem',
    },
    footerLink: {
      color: 'rgba(255,211,105,0.6)',
      fontSize: '0.65rem',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      textDecoration: 'none',
      cursor: 'pointer',
    },
  };

  const emailHasError = formik.touched.email && formik.errors.email;
  const passHasError = formik.touched.password && formik.errors.password;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .so-input:focus { border-color: rgba(255,211,105,0.6) !important; background: rgba(255,255,255,0.09) !important; }
        .so-eye:hover { color: rgba(255,255,255,0.7) !important; }
        .so-support:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      <div style={S.root}>
        {/* Background (fixed — purely decorative, no content that could
            ever overlap the form) */}
        <div style={S.bgLayer} />
        <div style={S.gridOverlay} />

        {/* Navbar — normal document flow, never overlaps content */}
        <nav style={S.nav}>
          <div style={S.logo}>
            <div style={S.logoIcon}>
              <Building2 size={18} color="#0F0F0F" strokeWidth={2.5} />
            </div>
            <span style={S.logoText}>StayOps</span>
          </div>
          <button style={S.supportBtn} className="so-support">Support</button>
        </nav>

        {/* Login Card — the only scrollable area */}
        <div style={S.cardWrap}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={S.card}
          >
            {/* Header */}
            <div style={S.cardHeader}>
              <div style={S.badge}>
                <Shield size={11} /> Premium Residence Management
              </div>
              <h1 style={S.h1}>Welcome Back</h1>
              <p style={S.subtitle}>Sign in to your StayOps dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} style={S.form}>
              {formError && <div style={S.errorBox}>{formError}</div>}

              {/* Email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Email Address</label>
                <div style={S.inputWrap}>
                  <span style={{ ...S.inputIcon, color: emailHasError ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                    <Mail size={17} />
                  </span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    style={{ ...S.input, ...(emailHasError ? S.inputError : {}) }}
                    className="so-input"
                    {...formik.getFieldProps('email')}
                  />
                </div>
                <AnimatePresence>
                  {emailHasError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={S.fieldErrorText}
                    >
                      {formik.errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div style={S.fieldWrap}>
                <div style={S.passLabelRow}>
                  <label style={S.label}>Password</label>
                  <a href="#" style={S.forgotLink}>Forgot Password?</a>
                </div>
                <div style={S.inputWrap}>
                  <span style={{ ...S.inputIcon, color: passHasError ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                    <Lock size={17} />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    style={{ ...S.input, paddingRight: '3rem', ...(passHasError ? S.inputError : {}) }}
                    className="so-input"
                    {...formik.getFieldProps('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={S.eyeBtn}
                    className="so-eye"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <AnimatePresence>
                  {passHasError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={S.fieldErrorText}
                    >
                      {formik.errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                type="submit"
                disabled={loading}
                style={{ ...S.submitBtn, opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
                {!loading && <ArrowRight size={18} strokeWidth={3} />}
              </motion.button>
            </form>

            <p style={S.footerText}>
              Need access?{' '}
              <a href="#" style={{ color: '#FFD369', fontWeight: '700' }}>Contact Administrator</a>
            </p>
          </motion.div>
        </div>

        {/* Page Footer */}
        <footer style={S.pageFooter}>
          <div style={S.footerBrand}>
            <div style={S.footerDot}>
              <Building2 size={9} color="#0F0F0F" strokeWidth={3} />
            </div>
            <span style={S.footerBrandText}>Managing 1,000+ Residences Nationwide</span>
          </div>

          <div style={S.avatarRow}>
            <div style={{ display: 'flex' }}>
              {[42, 43, 44].map((seed) => (
                <img
                  key={seed}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  alt="user"
                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #0F0F0F', marginLeft: seed === 42 ? 0 : '-8px', background: '#1a1a1a' }}
                />
              ))}
              <div style={S.avatarMore}>+2k</div>
            </div>
            <span style={{ color: 'rgba(255,211,105,0.5)', fontSize: '0.68rem', fontWeight: '700' }}>
              Trusted by PG Owners
            </span>
          </div>

          <div style={S.footerLinks}>
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <a key={l} href="#" style={S.footerLink}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}