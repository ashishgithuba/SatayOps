import React, { useState, useEffect } from 'react';
import { allocationService, invoiceService, maintenanceService, noticeService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import { BedDouble, Receipt, Wrench, Megaphone, CheckCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        const [allocRes, invoiceRes, maintRes, noticeRes] = await Promise.all([
          allocationService.getResidentCurrentAllocation(user.id).catch(() => ({ data: null })),
          invoiceService.getInvoices({ resident_id: user.id, status: 'PENDING' }).catch(() => ({ data: [] })),
          maintenanceService.getRequests({ resident_id: user.id }).catch(() => ({ data: [] })),
          noticeService.getNotices({ status: 'PUBLISHED' }).catch(() => ({ data: [] }))
        ]);

        setAllocation(allocRes.data);
        setInvoices(invoiceRes.data || []);
        setRequests(maintRes.data || []);
        setNotices(noticeRes.data || []);
      } catch (err) {
        console.error('Failed to load resident dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading your dashboard...</div>;
  }

  const dueAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>Welcome, {user?.name || 'Resident'} 👋</h1>
          <p style={{ color: '#64748b' }}>
            {allocation?.pg?.name ? `Here's what's happening in ${allocation.pg.name} today.` : "Here's what's happening in your PG today."}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Allocation Card */}
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', padding: '1.5rem', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(14, 165, 233, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Current Stay</h3>
            <BedDouble size={24} />
          </div>
          {allocation ? (
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.2rem' }}>Room {allocation.room?.room_number || 'N/A'}</div>
              <div style={{ opacity: 0.9, fontWeight: '600', fontSize: '1.1rem' }}>Bed: {allocation.bed?.bed_number || 'N/A'}</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>PG: {allocation.pg?.name || 'N/A'}</div>
              <div style={{ fontSize: '0.85rem', marginTop: '1rem', background: 'rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'inline-block' }}>
                Joined: {new Date(allocation.check_in_date).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <p style={{ opacity: 0.9 }}>No active allocation found.</p>
          )}
        </div>

        {/* Payments Card */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Dues & Payments</h3>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '8px', color: '#d97706' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            ₹{dueAmount}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Total Pending Amount</p>
          <Link to="/resident-payments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
            Pay Now <ArrowRight size={16} />
          </Link>
        </div>

        {/* Maintenance Card */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Maintenance</h3>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', color: '#dc2626' }}>
              <Wrench size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            {pendingRequests.length}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Active Requests</p>
          <Link to="/resident-maintenance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
            View Tickets <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Two Column Layout for Announcements & Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Recent Notices */}
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={20} color="#0ea5e9" /> Recent Announcements
          </h2>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {notices.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No recent announcements.
              </div>
            ) : (
              <div>
                {notices.slice(0, 5).map((notice, idx) => (
                  <div key={notice.id} style={{ padding: '1.25rem 1.5rem', borderBottom: idx !== notices.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px' }}>
                      <FileText size={20} color="#64748b" />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>{notice.title}</h4>
                      <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{notice.description}</p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(notice.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Maintenance Requests */}
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} color="#dc2626" /> Recent Maintenance
          </h2>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {requests.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No recent maintenance requests.
              </div>
            ) : (
              <div>
                {requests.slice(0, 5).map((req, idx) => {
                  let statusBg = '#f1f5f9';
                  let statusColor = '#475569';
                  if (req.status === 'OPEN') { statusBg = '#fef3c7'; statusColor = '#b45309'; }
                  if (req.status === 'IN_PROGRESS') { statusBg = '#e0e7ff'; statusColor = '#4338ca'; }
                  if (req.status === 'RESOLVED') { statusBg = '#dcfce7'; statusColor = '#15803d'; }
                  
                  return (
                    <div key={req.id} style={{ padding: '1.25rem 1.5rem', borderBottom: idx !== requests.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontWeight: '700', color: '#0f172a', margin: 0 }}>{req.title}</h4>
                        <span style={{ background: statusBg, color: statusColor, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>
                          {req.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(req.created_at).toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {req.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {requests.length > 5 && (
                  <Link to="/resident-maintenance" style={{ display: 'block', textAlign: 'center', padding: '1rem', background: '#f8fafc', color: '#0ea5e9', fontWeight: '700', textDecoration: 'none', borderTop: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                    View all {requests.length} requests
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
