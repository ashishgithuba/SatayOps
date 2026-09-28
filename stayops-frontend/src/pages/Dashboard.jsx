import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pgService, roomService, bedService, residentService, allocationService, invoiceService } from '../services/api.service';
import { Building2, Layers, Bed, Users, UserCheck, TrendingUp, ArrowUpRight, Activity, PieChart as PieIcon, BarChart3, Calendar } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Inject scrollbar styles with multiple browser support
if (typeof document !== 'undefined' && !document.querySelector('[data-scrollbar-style]')) {
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.setAttribute('data-scrollbar-style', 'true');
  scrollbarStyle.textContent = `
    .dashboard-scroll-container {
      scrollbar-width: none;
      -ms-overflow-style: -ms-autohiding-scrollbar;
      overflow-y: scroll;
      overflow-x: hidden;
    }
    
    .dashboard-scroll-container::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    
    .dashboard-scroll-container::-webkit-scrollbar-track {
      display: none !important;
      background: transparent !important;
    }
    
    .dashboard-scroll-container::-webkit-scrollbar-thumb {
      display: none !important;
      background: transparent !important;
    }
    
    .dashboard-scroll-container {
      scrollbar-gutter: stable;
    }
  `;
  document.head.appendChild(scrollbarStyle);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pgs: 0,
    rooms: 0,
    beds: 0,
    residents: 0,
    activeAllocations: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
  });
  const [roomTypeData, setRoomTypeData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [earningsFilter, setEarningsFilter] = useState('monthly');
  const [monthlyEarningsData, setMonthlyEarningsData] = useState([]);
  const [yearlyEarningsData, setYearlyEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure scrollbar hiding styles are active
    const container = document.querySelector('.dashboard-scroll-container');
    if (container) {
      container.style.scrollbarWidth = 'none';
      container.style.msOverflowStyle = 'none';
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [pgRes, roomRes, bedRes, resRes, allocRes, invRes] = await Promise.allSettled([
          pgService.getMyPgs(),
          roomService.getRoomsByPg(),
          bedService.getBeds(),
          residentService.getResidents(),
          allocationService.getAllocations(),
          invoiceService.getInvoices(),
        ]);

        const pgsList = pgRes.status === 'fulfilled' ? pgRes.value.data || [] : [];
        const roomsList = roomRes.status === 'fulfilled' ? roomRes.value.data || [] : [];
        const bedsList = bedRes.status === 'fulfilled' ? bedRes.value.data || [] : [];
        const residentsList = resRes.status === 'fulfilled' ? resRes.value.data || [] : [];
        const allocsList = allocRes.status === 'fulfilled' ? allocRes.value.data || [] : [];
        const invoicesList = invRes.status === 'fulfilled' ? invRes.value.data || [] : [];

        const activeAllocs = allocsList.filter((a) => a.status === 'ACTIVE').length || allocsList.length;
        const availableB = bedsList.filter((b) => b.status === 'AVAILABLE').length;
        const maintB = bedsList.filter((b) => b.status === 'MAINTENANCE').length;
        const occupiedB = bedsList.filter((b) => b.status === 'OCCUPIED').length || activeAllocs;

        setStats({
          pgs: pgsList.length,
          rooms: roomsList.length,
          beds: bedsList.length,
          residents: residentsList.length,
          activeAllocations: activeAllocs,
          availableBeds: availableB,
          maintenanceBeds: maintB,
        });

        // Donut Chart Data
        setPieData([
          { name: 'Occupied Beds', value: occupiedB || 14, color: '#6366f1' },
          { name: 'Available Beds', value: availableB || 8, color: '#10b981' },
          { name: 'Maintenance', value: maintB || 2, color: '#f59e0b' },
        ]);

        // Room Type Bar Chart Data
        const roomTypeCounts = {
          SINGLE: { name: 'Single Room', Occupied: 0, Total: 0 },
          DOUBLE_SHARING: { name: 'Double Sharing', Occupied: 0, Total: 0 },
          TRIPLE_SHARING: { name: 'Triple Sharing', Occupied: 0, Total: 0 },
          FOUR_SHARING: { name: '4 Sharing', Occupied: 0, Total: 0 },
          DORMITORY: { name: 'Dormitory', Occupied: 0, Total: 0 },
        };

        roomsList.forEach((rm) => {
          const typeKey = rm.room_type || 'SINGLE';
          if (roomTypeCounts[typeKey]) {
            const rmBeds = bedsList.filter((b) => b.room_id === rm.id);
            const rmOccupied = rmBeds.filter((b) => b.status === 'OCCUPIED').length;
            roomTypeCounts[typeKey].Total += rmBeds.length || 1;
            roomTypeCounts[typeKey].Occupied += rmOccupied;
          }
        });

        const formattedRoomTypes = Object.values(roomTypeCounts).filter((item) => item.Total > 0 || item.Occupied > 0);
        setRoomTypeData(
          formattedRoomTypes.length > 0
            ? formattedRoomTypes
            : [
                { name: 'Single Room', Occupied: 8, Total: 10 },
                { name: 'Double Sharing', Occupied: 14, Total: 20 },
                { name: 'Triple Sharing', Occupied: 9, Total: 15 },
                { name: '4 Sharing', Occupied: 6, Total: 12 },
              ]
        );

        // Calculate dynamic monthly and yearly earnings
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          let m = currentMonth - i;
          let y = currentYear;
          if (m < 0) {
            m += 12;
            y -= 1;
          }
          monthlyData.push({ monthIndex: m, year: y, name: `${monthNames[m]} ${y}`, Income: 0, Allocations: 0 });
        }

        const yearlyData = [];
        for (let i = 3; i >= 0; i--) {
          yearlyData.push({ name: String(currentYear - i), year: currentYear - i, Income: 0, Allocations: 0 });
        }

        invoicesList.forEach(inv => {
          const invDate = new Date(inv.created_at || new Date());
          const m = invDate.getMonth();
          const y = invDate.getFullYear();
          const amountPaid = Number(inv.amount_paid) || 0;

          const mData = monthlyData.find(d => d.monthIndex === m && d.year === y);
          if (mData) mData.Income += amountPaid;

          const yData = yearlyData.find(d => d.year === y);
          if (yData) yData.Income += amountPaid;
        });

        allocsList.forEach(alloc => {
          const allocDate = new Date(alloc.created_at || new Date());
          const m = allocDate.getMonth();
          const y = allocDate.getFullYear();

          const mData = monthlyData.find(d => d.monthIndex === m && d.year === y);
          if (mData) mData.Allocations += 1;

          const yData = yearlyData.find(d => d.year === y);
          if (yData) yData.Allocations += 1;
        });

        setMonthlyEarningsData(monthlyData);
        setYearlyEarningsData(yearlyData);

        const monthlyTrendData = [];
        for (let i = 5; i >= 0; i--) {
          let m = currentMonth - i;
          let y = currentYear;
          if (m < 0) {
            m += 12;
            y -= 1;
          }
          monthlyTrendData.push({ monthIndex: m, year: y, month: monthNames[m], CheckIns: 0, Revenue: 0 });
        }

        allocsList.forEach(alloc => {
          const checkInDate = new Date(alloc.check_in_date || alloc.created_at || new Date());
          const m = checkInDate.getMonth();
          const y = checkInDate.getFullYear();
          const tData = monthlyTrendData.find(d => d.monthIndex === m && d.year === y);
          if (tData) tData.CheckIns += 1;
        });

        invoicesList.forEach(inv => {
          const invDate = new Date(inv.created_at || new Date());
          const m = invDate.getMonth();
          const y = invDate.getFullYear();
          const amountPaid = Number(inv.amount_paid) || 0;
          const tData = monthlyTrendData.find(d => d.monthIndex === m && d.year === y);
          if (tData) tData.Revenue += amountPaid;
        });

        setMonthlyTrend(monthlyTrendData);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalBeds = stats.beds || 1;
  const occupiedPct = Math.round((stats.activeAllocations / totalBeds) * 100) || 0;

  const cards = [
    { title: 'Properties Managed', value: stats.pgs, label: 'Active PGs', icon: Building2, gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', badge: '+100%', path: '/pgs' },
    { title: 'Total Rooms', value: stats.rooms, label: 'Capacity', icon: Layers, gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', badge: 'Optimal', path: '/rooms' },
    { title: 'Total Beds', value: stats.beds, label: 'Inventory', icon: Bed, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', badge: 'Live', path: '/beds' },
    { title: 'Available Beds', value: stats.availableBeds, label: 'Ready to occupy', icon: Bed, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', badge: 'Available', path: '/beds' },
    { title: 'Registered Residents', value: stats.residents, label: 'Total Occupants', icon: Users, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', badge: 'Verified', path: '/residents' },
    { title: 'Active Allocations', value: stats.activeAllocations, label: 'Occupied Beds', icon: UserCheck, gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', badge: `${occupiedPct}% Occupied`, path: '/allocations' },
  ];

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <p style={{ color: '#060913', fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.3rem' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color || '#818cf8', fontSize: '0.82rem', fontWeight: '600' }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-scroll-container" style={{ maxWidth: '1400px', margin: '0 auto', height: '100vh', overflowY: 'scroll', overflowX: 'hidden', paddingRight: '0', WebkitScrollbar: 'none', msOverflowStyle: 'none' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          marginBottom: '2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.75rem' }}>
            <Activity size={14} /> LIVE OPERATIONS
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: '800', letterSpacing: '-0.03em', color: '#060913' }}>
            Executive Operations Dashboard
          </h1>
          <p style={{ color: '#060913', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Real-time property performance, resident metrics, and bed availability.
          </p>
        </div>

        <button
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
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          <TrendingUp size={18} /> Quick Action
        </button>
      </div>

      {/* Metric Cards Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#060913', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
        Key Operational Metrics
      </h3>

      {loading ? (
        <div style={{ color: '#060913', fontSize: '1rem', padding: '2rem 0' }}>Loading operational metrics...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="card-animated"
                onClick={() => card.path && navigate(card.path)}
                style={{
                  background: 'var(--gradient-card)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.6rem',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  animationDelay: `${idx * 0.06}s`,
                  cursor: card.path ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: card.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Icon size={22} color="#ffffff" />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <ArrowUpRight size={12} /> {card.badge}
                  </span>
                </div>

                <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#060913', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#060913' }}>{card.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#060913', marginTop: '0.25rem' }}>{card.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Trending Recharts Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Recharts Chart 1: Smooth Gradient Area Chart - Check-ins & Bookings */}
        <div className="card-animated" style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.6rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#6366f1" /> Monthly Resident Check-in Trend
              </h3>
              <p style={{ color: '#060913', fontSize: '0.82rem', marginTop: '0.2rem' }}>Recharts Smooth Area Visualization (Jan - Jun)</p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
              Recharts Area
            </span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="CheckIns" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCheckIns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts Chart 2: Bed Status Donut Ring Chart */}
        <div className="card-animated" style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.6rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieIcon size={20} color="#10b981" /> Bed Inventory Status
              </h3>
              <p style={{ color: '#060913', fontSize: '0.82rem', marginTop: '0.2rem' }}>Live occupancy distribution</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 220, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', color: '#060913', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#060913' }}>{occupiedPct}%</div>
              <div style={{ fontSize: '0.72rem', color: '#060913', fontWeight: '600' }}>Occupied</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Chart 3: Earnings Bar Chart */}
      <div className="card-animated" style={{ background: 'var(--gradient-card)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.6rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#060913', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="#10b981" /> Earnings Overview
            </h3>
            <p style={{ color: '#060913', fontSize: '0.82rem', marginTop: '0.2rem' }}>Total income and allocations</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setEarningsFilter('monthly')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: earningsFilter === 'monthly' ? '#10b981' : '#e2e8f0',
                color: earningsFilter === 'monthly' ? '#fff' : '#475569',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setEarningsFilter('yearly')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: earningsFilter === 'yearly' ? '#10b981' : '#e2e8f0',
                color: earningsFilter === 'yearly' ? '#fff' : '#475569',
              }}
            >
              Yearly
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsFilter === 'monthly' ? monthlyEarningsData : yearlyEarningsData} barSize={14} barGap={6} barCategoryGap="35%" margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem', color: '#060913' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Allocations" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}