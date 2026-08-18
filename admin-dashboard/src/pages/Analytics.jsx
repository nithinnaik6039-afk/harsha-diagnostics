import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuthStore } from '../store/authStore';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

import { BACKEND_URL } from '../constants/api';
const PERIOD_OPTIONS = ['Week', 'Month', 'Year'];

function isSameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getLastNMonths(n) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  return months;
}

function formatDay(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function formatMonth(d) {
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 10,
    },
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,0.4)' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,0.4)' }, beginAtZero: true },
  },
};

function KpiCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-center shadow-lg">
      <div className={`text-3xl p-3 rounded-xl ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, height = 260 }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export default function Analytics() {
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Week');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPIs
  const totalRevenue = orders.filter(o => o.payment.status === 'Paid').reduce((s, o) => s + o.payment.amount, 0);
  const completedOrders = orders.filter(o => o.status === 'ReportReady').length;
  const avgOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
  const mltPerformanceMap = {};
  orders.forEach(o => {
    if (o.assignedMLT && o.status === 'ReportReady') {
      const name = o.assignedMLT.name || String(o.assignedMLT);
      mltPerformanceMap[name] = (mltPerformanceMap[name] || 0) + 1;
    }
  });
  const topMlt = Object.entries(mltPerformanceMap).sort((a, b) => b[1] - a[1])[0];

  // Time helpers
  const getOrdersForDay = (day) =>
    orders.filter(o => isSameDay(new Date(o.createdAt || o.slot?.date || Date.now()), day));
  const getRevenueForDay = (day) =>
    getOrdersForDay(day).filter(o => o.payment.status === 'Paid').reduce((s, o) => s + o.payment.amount, 0);

  // Revenue chart
  let revenueLabels = [], revenueCurrentData = [], revenuePrevData = [];
  if (period === 'Week') {
    const days = getLastNDays(7);
    const prevDays = days.map(d => { const pd = new Date(d); pd.setDate(pd.getDate() - 7); return pd; });
    revenueLabels = days.map(formatDay);
    revenueCurrentData = days.map(getRevenueForDay);
    revenuePrevData = prevDays.map(getRevenueForDay);
  } else if (period === 'Month') {
    const days = getLastNDays(30);
    const prevDays = days.map(d => { const pd = new Date(d); pd.setDate(pd.getDate() - 30); return pd; });
    // Group by 7-day chunks
    const chunk = (arr) => arr.reduce((all, one, i) => {
      const ch = Math.floor(i / 7); all[ch] = [...(all[ch] || []), one]; return all;
    }, []);
    const curr = chunk(days);
    const prev = chunk(prevDays);
    revenueLabels = curr.map((c, i) => `W${i + 1} ${formatDay(c[0])}`);
    revenueCurrentData = curr.map(c => c.reduce((s, d) => s + getRevenueForDay(d), 0));
    revenuePrevData = prev.map(c => c.reduce((s, d) => s + getRevenueForDay(d), 0));
  } else {
    const months = getLastNMonths(12);
    const prevMonths = months.map(d => { const pd = new Date(d); pd.setFullYear(pd.getFullYear() - 1); return pd; });
    revenueLabels = months.map(formatMonth);
    revenueCurrentData = months.map(m =>
      orders.filter(o => {
        const od = new Date(o.createdAt || o.slot?.date || Date.now());
        return od.getMonth() === m.getMonth() && od.getFullYear() === m.getFullYear() && o.payment.status === 'Paid';
      }).reduce((s, o) => s + o.payment.amount, 0)
    );
    revenuePrevData = prevMonths.map(m =>
      orders.filter(o => {
        const od = new Date(o.createdAt || o.slot?.date || Date.now());
        return od.getMonth() === m.getMonth() && od.getFullYear() === m.getFullYear() && o.payment.status === 'Paid';
      }).reduce((s, o) => s + o.payment.amount, 0)
    );
  }

  const revenueChartData = {
    labels: revenueLabels,
    datasets: [
      {
        label: `This ${period}`,
        data: revenueCurrentData,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#38bdf8',
      },
      {
        label: `Prev ${period}`,
        data: revenuePrevData,
        borderColor: '#475569',
        backgroundColor: 'rgba(71,85,105,0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderDash: [4, 4],
        pointBackgroundColor: '#475569',
      },
    ],
  };

  // Orders bar chart (last 14 days)
  const last14Days = getLastNDays(14);
  const ordersBarData = {
    labels: last14Days.map(formatDay),
    datasets: [
      {
        label: 'Bookings',
        data: last14Days.map(d => getOrdersForDay(d).length),
        backgroundColor: 'rgba(139,92,246,0.7)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Completed',
        data: last14Days.map(d => getOrdersForDay(d).filter(o => o.status === 'ReportReady').length),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // MLT performance bar
  const mltNames = Object.keys(mltPerformanceMap);
  const mltBarData = {
    labels: mltNames.length ? mltNames : ['No completions yet'],
    datasets: [{
      label: 'Completions',
      data: mltNames.length ? mltNames.map(n => mltPerformanceMap[n]) : [0],
      backgroundColor: ['rgba(56,189,248,0.7)', 'rgba(245,158,11,0.7)', 'rgba(168,85,247,0.7)', 'rgba(239,68,68,0.7)'],
      borderRadius: 6,
    }],
  };

  // Doughnut
  const statusGroups = {
    Booked: orders.filter(o => o.status === 'Booked').length,
    'In Progress': orders.filter(o => ['Assigned', 'OnTheWay', 'Arrived', 'Collected', 'Submitted'].includes(o.status)).length,
    Completed: orders.filter(o => o.status === 'ReportReady').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };
  const doughnutData = {
    labels: Object.keys(statusGroups),
    datasets: [{
      data: Object.values(statusGroups),
      backgroundColor: ['#0284c7', '#f59e0b', '#10b981', '#ef4444'],
      borderColor: '#0f172a',
      borderWidth: 3,
    }],
  };

  // CSV download
  const downloadCSV = () => {
    const rows = [
      ['Order ID', 'Patient', 'Age', 'Tests', 'Status', 'Payment Status', 'Amount (Rs)', 'Method', 'Slot Date', 'Slot Time', 'Assigned MLT'],
      ...orders.map(o => [
        o._id,
        o.patient.name,
        o.patient.age,
        o.tests.map(t => t.name).join(' | '),
        o.status,
        o.payment.status,
        o.payment.amount,
        o.payment.method,
        new Date(o.slot.date).toLocaleDateString('en-IN'),
        o.slot.time,
        o.assignedMLT?.name || 'Unassigned',
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harsha-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mb-4" />
          <p className="text-slate-400 text-sm">Crunching analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">📊 Analytics & Reports</h2>
          <p className="text-slate-400 text-sm mt-1">Compare periods, track trends, and download full data exports</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${period === p ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            🔄 Refresh
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-900/30">
            ⬇️ Download CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} sub={`${completedOrders} paid orders`} icon="💰" accent="bg-emerald-950 text-emerald-400" />
        <KpiCard label="Total Bookings" value={orders.length} sub={`${completedOrders} completed`} icon="📋" accent="bg-sky-950 text-sky-400" />
        <KpiCard label="Avg. Order Value" value={`₹${avgOrderValue}`} sub="Per completed order" icon="📊" accent="bg-violet-950 text-violet-400" />
        <KpiCard label="Top MLT" value={topMlt ? topMlt[0].split(' ')[0] : '—'} sub={topMlt ? `${topMlt[1]} completions` : 'No data yet'} icon="🏆" accent="bg-amber-950 text-amber-400" />
      </div>

      {/* Revenue + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title={`Revenue — ${period}ly Comparison`} subtitle="This period (solid blue) vs. previous (dashed grey)" height={280}>
            <Line data={revenueChartData} options={{
              ...chartDefaults,
              plugins: { ...chartDefaults.plugins, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: (ctx) => `₹${ctx.raw.toLocaleString('en-IN')}` } } }
            }} />
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Order Status Mix" subtitle="Current distribution of all orders" height={280}>
            <Doughnut data={doughnutData} options={{
              ...chartDefaults,
              scales: undefined,
              cutout: '65%',
              plugins: { ...chartDefaults.plugins, legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 12 } } },
            }} />
          </ChartCard>
        </div>
      </div>

      {/* Volume + MLT Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Daily Booking Volume" subtitle="Last 14 days — bookings vs completions" height={260}>
          <Bar data={ordersBarData} options={chartDefaults} />
        </ChartCard>
        <ChartCard title="MLT Performance" subtitle="Total completed orders per phlebotomist" height={260}>
          <Bar data={mltBarData} options={{ ...chartDefaults, indexAxis: 'y' }} />
        </ChartCard>
      </div>

      {/* Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white">Status Breakdown Summary</h3>
          <span className="text-xs text-slate-400">{orders.length} total records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Count</th>
                <th className="px-6 py-3">Revenue (₹)</th>
                <th className="px-6 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[
                { status: 'Booked', color: 'text-sky-400' },
                { status: 'Assigned', color: 'text-amber-400' },
                { status: 'OnTheWay', color: 'text-orange-400' },
                { status: 'Arrived', color: 'text-lime-400' },
                { status: 'Collected', color: 'text-violet-400' },
                { status: 'Submitted', color: 'text-indigo-400' },
                { status: 'ReportReady', color: 'text-emerald-400' },
                { status: 'Cancelled', color: 'text-rose-400' },
              ].map(({ status, color }) => {
                const sOrders = orders.filter(o => o.status === status);
                const rev = sOrders.filter(o => o.payment.status === 'Paid').reduce((s, o) => s + o.payment.amount, 0);
                const pct = orders.length > 0 ? ((sOrders.length / orders.length) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={status} className="hover:bg-slate-800/30 transition-colors">
                    <td className={`px-6 py-3 font-semibold ${color}`}>{status}</td>
                    <td className="px-6 py-3 text-white font-bold">{sOrders.length}</td>
                    <td className="px-6 py-3 text-emerald-300">₹{rev.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 max-w-[80px]">
                          <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-400 text-xs">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
