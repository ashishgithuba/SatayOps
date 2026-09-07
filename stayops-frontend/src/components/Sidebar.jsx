import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Bed,
  Users,
  UserCheck,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onClose, isMobile }) {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'PG Properties', path: '/pgs', icon: Building2 },
    { name: 'Floors & Rooms', path: '/rooms', icon: Layers },
    { name: 'Beds', path: '/beds', icon: Bed },
    { name: 'Residents', path: '/residents', icon: Users },
    { name: 'Allocations', path: '/allocations', icon: UserCheck },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      style={{
        width: '270px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.75rem 1.25rem',
        overflowY: 'auto',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(255, 211, 105, 0.4)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} color="#060913" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                color: '#0f172a',
              }}
            >
              StayOps
            </div>
            <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              LUXURY RESIDENCE
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Header */}
      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.85rem', paddingLeft: '0.5rem' }}>
        Executive Controls
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                color: isActive ? '#78350f' : '#475569',
                background: isActive ? 'linear-gradient(90deg, rgba(255, 211, 105, 0.4) 0%, rgba(255, 211, 105, 0.1) 100%)' : 'transparent',
                borderLeft: isActive ? '4px solid #f59e0b' : '4px solid transparent',
                border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                boxShadow: isActive ? '0 4px 12px rgba(255, 211, 105, 0.18)' : 'none',
                fontWeight: isActive ? '800' : '600',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                textDecoration: 'none',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <Icon size={20} color={undefined} />
                <span style={{ fontSize: '0.92rem', letterSpacing: '0.01em' }}>{item.name}</span>
              </div>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Sign Out Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0.65rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffd369 0%, #faab36 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#060913', flexShrink: 0, fontSize: '1.05rem', boxShadow: '0 4px 12px rgba(255,211,105,0.4)' }}>
            {user?.name ? user.name[0].toUpperCase() : 'O'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.name || 'PG Owner'}
            </div>
            <div style={{ color: '#d97706', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '700' }}>
              <ShieldCheck size={12} /> Executive Owner
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.68rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: '700',
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
