import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease',
          flexShrink: 0,
        }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Mobile Top Navbar */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: 'rgba(17, 24, 39, 0.95)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              position: 'sticky',
              top: 0,
              zIndex: 30,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'transparent', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Menu size={24} />
            </button>
            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#f9fafb' }}>StayOps</span>
            <div style={{ width: 24 }} />
          </div>
        )}

        <div style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
