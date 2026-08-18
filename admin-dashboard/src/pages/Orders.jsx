import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/StatCard';

const BACKEND_URL = typeof window !== 'undefined' && window.location?.hostname ? `http://${window.location.hostname}:5005` : 'http://localhost:5005';

export default function Orders() {
  const token = useAuthStore((state) => state.token);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportUrlInput, setReportUrlInput] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, nextStatus, extra = {}) => {
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/orders/${orderId}/status`,
        { status: nextStatus, ...extra },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update local list
        setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.data : o)));
        setSelectedOrder(null);
        setReportUrlInput('');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Math helpers
  const activeBookings = orders.filter((o) => !['ReportReady', 'Cancelled'].includes(o.status));
  const completedCount = orders.filter((o) => o.status === 'ReportReady').length;
  const paidRevenue = orders
    .filter((o) => o.payment.status === 'Paid')
    .reduce((sum, o) => sum + o.payment.amount, 0);
  const pendingRevenue = orders
    .filter((o) => o.payment.status === 'Pending' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.payment.amount, 0);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return !['ReportReady', 'Cancelled'].includes(o.status);
    if (filter === 'Completed') return o.status === 'ReportReady';
    if (filter === 'Cancelled') return o.status === 'Cancelled';
    if (filter === 'Paid') return o.payment.status === 'Paid';
    if (filter === 'Pending Payment') return o.payment.status === 'Pending' && o.status !== 'Cancelled';
    return true;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ReportReady':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60';
      case 'Cancelled':
        return 'bg-rose-950/40 text-rose-300 border-rose-900/60';
      case 'Booked':
        return 'bg-sky-950/40 text-sky-300 border-sky-900/60';
      case 'Assigned':
        return 'bg-amber-950/40 text-amber-300 border-amber-900/60';
      case 'OnTheWay':
        return 'bg-amber-950/40 text-amber-300 border-amber-900/60';
      case 'Arrived':
        return 'bg-lime-950/40 text-lime-300 border-lime-900/60';
      case 'Collected':
        return 'bg-violet-950/60 text-violet-300 border-violet-700 animate-pulse';
      case 'Submitted':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white tracking-tight">Orders Board</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-sky-950 text-sky-400 border border-sky-800/80">
              Live Stream
            </span>
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-1">Real-time diagnostics home sample collection oversight</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <span>🔄</span> Refresh Board
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <StatCard title="Collected Revenue" value={`₹ ${paidRevenue.toLocaleString('en-IN')}`} icon="💰" colorClass="text-emerald-400" />
        <StatCard title="Pending Payments" value={`₹ ${pendingRevenue.toLocaleString('en-IN')}`} icon="⏳" colorClass="text-amber-400" />
        <StatCard title="Active Appointments" value={activeBookings.length} icon="🔬" colorClass="text-sky-400" />
        <StatCard title="Finished Reports" value={completedCount} icon="📋" colorClass="text-violet-400" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-4 mb-6">
        {['All', 'Active', 'Completed', 'Paid', 'Pending Payment', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400">Loading collection pipeline data...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">ID / Patient</th>
                <th className="py-4 px-6">Tests Catalog</th>
                <th className="py-4 px-6">Schedule Slot</th>
                <th className="py-4 px-6">Visit Address</th>
                <th className="py-4 px-6">Status / PIN</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-850/40 transition-colors">
                  {/* ID / Patient */}
                  <td className="py-4 px-6">
                    <span className="text-slate-500 text-xs font-mono block">#{order._id.substring(18)}</span>
                    <span className="text-white font-semibold mt-1 block">{order.patient.name}</span>
                    <span className="text-slate-400 text-xs">{order.patient.age} yrs • {order.patient.gender}</span>
                  </td>

                  {/* Tests */}
                  <td className="py-4 px-6 max-w-xs">
                    <div className="text-slate-200 text-sm font-semibold truncate">
                      {order.tests.map((t) => t.name).join(', ')}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      Charge: ₹ {order.payment.amount} ({order.collectionCharge > 0 ? `+₹${order.collectionCharge} fee` : 'Free visit'})
                    </div>
                  </td>

                  {/* Slot */}
                  <td className="py-4 px-6">
                    <span className="text-slate-200 text-sm block">
                      {new Date(order.slot.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-slate-400 text-xs mt-0.5 block">{order.slot.time}</span>
                  </td>

                  {/* Address */}
                  <td className="py-4 px-6 max-w-xs">
                    <span className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                      {order.address.addressLine}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Distance: {order.distanceFromCenter} km
                    </span>
                  </td>

                  {/* Status / PIN / Delivery Progress */}
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(order.status)}`}>
                      {order.status === 'Collected' ? '🩸 Blood in Transit (Delivering)' :
                       order.status === 'Arrived' ? '💉 Drawing at Home' :
                       order.status === 'OnTheWay' ? '🚗 En-Route' :
                       order.status === 'Submitted' ? '🧪 In Lab Analyzers' :
                       order.status}
                    </div>

                    {order.status === 'Collected' && (
                      <a
                        href="/live-tracking"
                        className="text-[11px] font-bold text-violet-400 hover:text-violet-300 block mt-1 underline"
                      >
                        🗺️ Track Blood Delivery →
                      </a>
                    )}

                    {order.status !== 'Cancelled' && order.status !== 'ReportReady' && (
                      <span className="text-[11px] font-mono font-bold text-slate-400 block mt-1">
                        Safety PIN: {order.safetyPin}
                      </span>
                    )}
                    {/* Report PDF link for completed orders */}
                    {order.status === 'ReportReady' && order.reports?.length > 0 && (
                      <a
                        href={order.reports[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        title={order.reports[0]}
                      >
                        📄 View PDF Report
                      </a>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      order.payment.status === 'Paid'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60'
                        : order.payment.status === 'Refunded'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                        : order.payment.method === 'CashOnCollection'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-900/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {order.payment.status === 'Paid' ? '✅' :
                       order.payment.method === 'CashOnCollection' ? '💵' : '⏳'}
                      {order.payment.status === 'Paid' ? 'Paid' :
                       order.payment.method === 'CashOnCollection' ? 'Cash' : 'Pending'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      ₹{order.payment.amount} • {order.payment.method}
                    </div>
                    {order.payment.razorpayPaymentId && (
                      <div className="text-[10px] font-mono text-emerald-500 mt-0.5 truncate max-w-[120px]" title={order.payment.razorpayPaymentId}>
                        {order.payment.razorpayPaymentId}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Action 1: Assign MLT */}
                      {order.status === 'Booked' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'Assigned', { mltId: '60c72b2f9b1d8a43288f6c44' })}
                          className="bg-sky-600/20 hover:bg-sky-600 border border-sky-850 hover:border-sky-500 text-sky-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          Assign Roster MLT
                        </button>
                      )}

                      {/* Action 2: Manual Upload report */}
                      {order.status === 'Submitted' && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-850 hover:border-emerald-500 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          Complete & Upload
                        </button>
                      )}

                      {/* Action 3: Cancel */}
                      {!['ReportReady', 'Cancelled'].includes(order.status) && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                          className="bg-rose-950/20 hover:bg-rose-600 border border-rose-900 hover:border-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center text-slate-500 text-sm">
              No orders matched this category pipeline.
            </div>
          )}
        </div>
      )}

      {/* Modal: Report PDF Upload Simulator */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Upload Lab PDF Report</h3>
            <p className="text-slate-400 text-xs mb-4">
              Enter the Cloudinary PDF URL to complete Patient: <strong className="text-white">{selectedOrder.patient.name}</strong>'s booking.
            </p>

            <input
              type="text"
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm mb-6"
              placeholder="e.g. https://cloudinary.com/reports/abc-123.pdf"
              value={reportUrlInput}
              onChange={(e) => setReportUrlInput(e.target.value)}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!reportUrlInput.trim()}
                onClick={() => handleUpdateStatus(selectedOrder._id, 'ReportReady', { reportUrl: reportUrlInput })}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Complete & Release Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
