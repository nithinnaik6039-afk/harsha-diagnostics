import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL =
  typeof window !== 'undefined' && window.location?.hostname
    ? `http://${window.location.hostname}:5005`
    : 'http://localhost:5005';

export default function LiveTracking() {
  const token = useAuthStore((s) => s.token);
  const [mlts, setMlts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [mapEngine, setMapEngine] = useState('google'); // google, cyber, satellite, streets
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [radarActive, setRadarActive] = useState(true);

  const fetchData = async () => {
    try {
      const [mltsRes, ordersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/mlts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (mltsRes.data.success) setMlts(mltsRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('LiveTracking fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const onlineMlts = mlts.filter((m) => m.isOnline);
  
  // Categorized Dispatches
  const activeDispatches = orders.filter((o) =>
    ['Assigned', 'OnTheWay', 'Arrived', 'Collected', 'Submitted'].includes(o.status)
  );
  const bloodInTransit = orders.filter((o) => o.status === 'Collected');
  const drawingAtHome = orders.filter((o) => o.status === 'Arrived');
  const enRouteToDraw = orders.filter((o) => o.status === 'OnTheWay');
  const inLabProcessing = orders.filter((o) => o.status === 'Submitted');

  // Filtered orders list based on owner selection
  const displayedOrders = orders.filter((o) => {
    if (activeFilter === 'COLLECTED') return o.status === 'Collected';
    if (activeFilter === 'ARRIVED') return o.status === 'Arrived';
    if (activeFilter === 'ON_THE_WAY') return o.status === 'OnTheWay';
    if (activeFilter === 'LAB_SUBMITTED') return o.status === 'Submitted';
    return !['ReportReady', 'Cancelled'].includes(o.status);
  });

  const getMapTileUrl = () => {
    if (mapEngine === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}';
    }
    if (mapEngine === 'streets') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    if (mapEngine === 'google') {
      return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
    // cyber dark
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Center coordinate of diagnostic hub (Anantapur)
  const hubLat = 14.6819;
  const hubLng = 77.6006;

  // Build Leaflet HTML to render on the Admin Dashboard (identical to MLT App radar)
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; font-family: -apple-system, sans-serif; overflow: hidden; }
        
        /* Radar Sweep Animation (like MLT App) */
        .radar-sweep {
          position: absolute; top: 50%; left: 50%; width: 280px; height: 280px;
          margin-top: -140px; margin-left: -140px; border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.4);
          background: conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0) 60deg, rgba(16, 185, 129, 0) 360deg);
          animation: spin 3s linear infinite; pointer-events: none; z-index: 500;
        }
        .radar-ring-1 {
          position: absolute; top: 50%; left: 50%; width: 130px; height: 130px;
          margin-top: -65px; margin-left: -65px; border-radius: 50%;
          border: 1px dashed rgba(56, 189, 248, 0.4); pointer-events: none; z-index: 490;
        }
        .radar-ring-2 {
          position: absolute; top: 50%; left: 50%; width: 240px; height: 240px;
          margin-top: -120px; margin-left: -120px; border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.2); pointer-events: none; z-index: 490;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .hub-pin {
          width: 32px; height: 32px; background: #0284c7; border-radius: 50%;
          box-shadow: 0 0 20px #0284c7, 0 0 40px #0284c7; display: flex; align-items: center;
          justify-content: center; font-size: 16px; border: 2.5px solid #ffffff;
        }
        .mlt-rider-pin {
          width: 30px; height: 30px; background: #10b981; border-radius: 50%;
          box-shadow: 0 0 20px #10b981, 0 0 40px #10b981; display: flex; align-items: center;
          justify-content: center; font-size: 15px; border: 2.5px solid #ffffff;
        }
        .mlt-blood-transit {
          background: #8b5cf6 !important;
          box-shadow: 0 0 20px #8b5cf6, 0 0 40px #8b5cf6 !important;
          animation: pulse 1.2s infinite;
        }
        .patient-pin {
          width: 28px; height: 28px; background: #ef4444; border-radius: 50%;
          box-shadow: 0 0 16px #ef4444; display: flex; align-items: center;
          justify-content: center; font-size: 15px; border: 2px solid #ffffff;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      ${radarActive ? '<div class="radar-ring-1"></div><div class="radar-ring-2"></div><div class="radar-sweep"></div>' : ''}
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${hubLat}, ${hubLng}], 13);
        L.tileLayer('${getMapTileUrl()}', { maxZoom: 19 }).addTo(map);

        // Harsha Central Laboratory Hub Marker
        const hubIcon = L.divIcon({ className: 'custom-icon', html: '<div class="hub-pin">🏥</div>', iconSize: [32, 32], iconAnchor: [16, 16] });
        L.marker([${hubLat}, ${hubLng}], { icon: hubIcon }).addTo(map).bindPopup("<b>🏥 Harsha Diagnostics Central Lab Hub</b><br>Main Analyzer Station & Cold Storage Hub");

        // 5km & 10km Radius Rings
        L.circle([${hubLat}, ${hubLng}], { radius: 5000, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.04, weight: 1.5, dashArray: '6, 6' }).addTo(map);
        L.circle([${hubLat}, ${hubLng}], { radius: 10000, color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.02, weight: 1, dashArray: '4, 4' }).addTo(map);

        // Plot Phlebotomists
        ${mlts
          .map((m, idx) => {
            const mLat = m.currentLocation?.lat || (hubLat + (idx === 0 ? 0.007 : idx === 1 ? -0.009 : 0.004));
            const mLng = m.currentLocation?.lng || (hubLng + (idx === 0 ? 0.006 : idx === 1 ? 0.008 : -0.007));
            const hasCollected = orders.some((o) => o.assignedMLT?._id === m._id && o.status === 'Collected');
            return `
              const mltIcon${idx} = L.divIcon({
                className: 'custom-icon',
                html: '<div class="mlt-rider-pin ${hasCollected ? 'mlt-blood-transit' : ''}">${hasCollected ? '🩸' : '🧑‍⚕️'}</div>',
                iconSize: [30, 30], iconAnchor: [15, 15]
              });
              L.marker([${mLat}, ${mLng}], { icon: mltIcon${idx} })
                .addTo(map)
                .bindPopup("<b>${m.name} (${m.role?.toUpperCase() || 'MLT'})</b><br>Status: <b>${m.isOnline ? '🟢 ON-DUTY (Online)' : '⚪ Standby'}</b><br>Phone: ${m.phone}<br>Specimen: <b>${hasCollected ? '🩸 BLOOD IN CRYO-BOX' : 'No specimen yet'}</b>");
            `;
          })
          .join('\n')}

        // Plot Active Patient Addresses
        ${activeDispatches
          .map((o, idx) => {
            const pLat = o.address?.coordinates?.lat || (hubLat + 0.005 * (idx + 1));
            const pLng = o.address?.coordinates?.lng || (hubLng + 0.004 * (idx + 1));
            const isCollected = o.status === 'Collected';
            return `
              const patIcon${idx} = L.divIcon({
                className: 'custom-icon',
                html: '<div class="patient-pin">${isCollected ? '🧪' : '📍'}</div>',
                iconSize: [28, 28], iconAnchor: [14, 14]
              });
              L.marker([${pLat}, ${pLng}], { icon: patIcon${idx} })
                .addTo(map)
                .bindPopup("<b>Patient: ${o.patient?.name}</b><br>Status: <b style='color:#34d399'>${o.status.toUpperCase()}</b><br>Address: ${o.address?.addressLine || 'Home'}<br>Specimen: <b>${isCollected ? 'COLLECTED (In Cryo Bag)' : 'Pending Phlebotomy Draw'}</b>");

              // Route Line to Hub
              L.polyline([[${hubLat}, ${hubLng}], [${pLat}, ${pLng}]], {
                color: '${isCollected ? '#8b5cf6' : '#10b981'}',
                weight: 2.5,
                opacity: 0.7,
                dashArray: '5, 5'
              }).addTo(map);
            `;
          })
          .join('\n')}
      </script>
    </body>
    </html>
  `;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-8 w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-base shadow-md shadow-sky-500/20">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight">
                Live Fleet Radar & Mapping
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                GPS Live
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Anantapuramu real-time dispatch radar, sample collection & cold-chain transit tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-900/80 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">
              {onlineMlts.length} MLTS ONLINE
            </span>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-1 rounded-xl text-xs font-semibold shadow-md active:scale-95"
          >
            🔄 Sync
          </button>
        </div>
      </div>

      {/* GPS Telemetry Bar (like MLT App) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3.5 mb-4 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">HUB COORDINATES:</span>
          <span className="font-mono font-bold text-sky-400 text-[11px] sm:text-xs">
            {hubLat}°N, {hubLng}°E
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">DISPATCH RADIUS:</span>
          <span className="font-bold text-emerald-400 text-[11px] sm:text-xs">10 KM Circular Grid</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">SATELLITES:</span>
          <span className="font-bold text-amber-400 text-[11px] sm:text-xs">🟢 9 Locked</span>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-4">
        {[
          { key: 'ALL', label: 'Active Dispatches', count: activeDispatches.length, color: 'sky', tag: '● Total Active' },
          { key: 'ON_THE_WAY', label: 'En-Route to Draw', count: enRouteToDraw.length, color: 'amber', tag: '🚗 On The Way' },
          { key: 'ARRIVED', label: 'At Patient Home', count: drawingAtHome.length, color: 'emerald', tag: '🏠 Drawing Sample' },
          { key: 'COLLECTED', label: 'Blood In Transit', count: bloodInTransit.length, color: 'violet', tag: '🩸 In Cold Bag' },
          { key: 'LAB_SUBMITTED', label: 'In Lab Analyzers', count: inLabProcessing.length, color: 'cyan', tag: '🧪 Processing' },
        ].map((kpi) => (
          <div
            key={kpi.key}
            onClick={() => setActiveFilter(kpi.key)}
            className={`cursor-pointer bg-slate-900/90 border rounded-2xl p-3 sm:p-4 transition-all shadow-lg hover:border-slate-700 ${
              activeFilter === kpi.key
                ? `border-${kpi.color}-500 bg-${kpi.color}-950/20`
                : 'border-slate-800'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{kpi.label}</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{kpi.count}</p>
            <span className="text-[9px] sm:text-[10px] text-slate-300 font-semibold">{kpi.tag}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: Interactive Map & Live Specimen Delivery Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Map Viewport Card */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative w-full">
            {/* Map Engine & Radar Controls Bar (Full Responsive Grid) */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Map Layer Switcher */}
              <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-1.5">
                {[
                  { id: 'google', label: '🌐 Google Live' },
                  { id: 'cyber', label: '🌙 Dark' },
                  { id: 'satellite', label: '🛰️ Sat' },
                  { id: 'streets', label: '🗺️ Map' },
                ].map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setMapEngine(engine.id)}
                    className={`py-1.5 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-center ${
                      mapEngine === engine.id
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {engine.label}
                  </button>
                ))}
              </div>

              {/* Radar Toggle Button */}
              <button
                onClick={() => setRadarActive(!radarActive)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  radarActive
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {radarActive ? '🟢 Radar Sweep ON' : '⚪ Radar OFF'}
              </button>
            </div>

            {/* Interactive Leaflet/Google Frame (Exact MLT App Height & Smooth Responsive Ratio) */}
            <div className="h-[340px] sm:h-[420px] md:h-[480px] relative bg-slate-950 w-full">
              <iframe
                key={`${mapEngine}-${radarActive}-${lastRefresh.getTime()}`}
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Owner Fleet Radar Map"
              />
            </div>

            {/* Bottom Map Legend */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs font-medium text-slate-400">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> 🏥 Lab Hub
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 🧑‍⚕️ Phlebo En-Route
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block animate-pulse" /> 🩸 Blood in Cryo-Box
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> 📍 Patient Home
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Sync: 8s</span>
            </div>
          </div>
        </div>

        {/* Live Specimen Delivery & Fleet Telemetry Drawer */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-extrabold text-white text-xs sm:text-sm tracking-tight flex items-center gap-2">
                🩸 Live Blood Deliveries & Status
              </h3>
              <span className="text-[10px] sm:text-xs font-bold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-800/60">
                {displayedOrders.length} Tasks
              </span>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                No active orders matching filter "{activeFilter}".
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {displayedOrders.map((order) => {
                  const isCollected = order.status === 'Collected';
                  const isSubmitted = order.status === 'Submitted';
                  const isArrived = order.status === 'Arrived';
                  const isOnTheWay = order.status === 'OnTheWay';

                  return (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCollected
                          ? 'bg-violet-950/20 border-violet-800/80 hover:border-violet-500 shadow-md shadow-violet-900/10'
                          : isArrived
                          ? 'bg-emerald-950/20 border-emerald-800/80 hover:border-emerald-500'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-bold text-white text-xs sm:text-sm">{order.patient?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {order.patient?.age} yrs • {order.patient?.gender}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-xl text-[9px] sm:text-[10px] font-extrabold uppercase border ${
                            isCollected
                              ? 'bg-violet-950 text-violet-300 border-violet-700 animate-pulse'
                              : isSubmitted
                              ? 'bg-sky-950 text-sky-300 border-sky-700'
                              : isArrived
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : isOnTheWay
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isCollected ? '🩸 IN TRANSIT' : order.status}
                        </span>
                      </div>

                      {/* Phlebotomist & Cold-Chain Info */}
                      <div className="bg-slate-950/60 rounded-xl p-2.5 mb-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 font-bold block text-[9px] uppercase">Rider / MLT</span>
                          <span className="font-semibold text-slate-200 text-xs">
                            🧑‍⚕️ {order.assignedMLT?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 font-bold block text-[9px] uppercase">Cold Chain</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {isCollected ? '🧊 4.2°C' : 'Standby'}
                          </span>
                        </div>
                      </div>

                      {/* Address & Tests Summary */}
                      <p className="text-[11px] text-slate-300 truncate">📍 {order.address?.addressLine}</p>
                      <p className="text-[10px] text-sky-400 mt-0.5 font-semibold truncate">
                        🧪 {order.tests?.map((t) => t.name).join(', ') || 'Diagnostic Panel'}
                      </p>

                      {/* Quick Action Button for Owner */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          PIN: <span className="text-amber-400 font-bold">{order.safetyPin || '9921'}</span>
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${order.address?.coordinates?.lat || 14.6819},${order.address?.coordinates?.lng || 77.6006}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          🗺️ Maps →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cold-Chain Quality Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl">
            <h3 className="font-extrabold text-white text-xs sm:text-sm tracking-tight mb-2.5 flex items-center gap-2">
              🧊 Fleet Cold-Chain Integrity Status
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-2xl p-2.5">
                <p className="text-[9px] font-bold text-emerald-400 uppercase">Biological Safe Zone</p>
                <p className="text-base sm:text-lg font-black text-emerald-300 mt-0.5">2.0°C – 8.0°C</p>
                <p className="text-[9px] text-slate-400 mt-0.5">100% compliant</p>
              </div>
              <div className="bg-sky-950/30 border border-sky-900/40 rounded-2xl p-2.5">
                <p className="text-[9px] font-bold text-sky-400 uppercase">Avg Delivery ETA</p>
                <p className="text-base sm:text-lg font-black text-sky-300 mt-0.5">18.4 Mins</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Direct to lab</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Order Detailed Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-base font-black text-white">Specimen & Delivery Audit</h3>
                <p className="text-xs text-slate-400">Order #{selectedOrder._id?.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-white">{selectedOrder.patient?.name} ({selectedOrder.patient?.age}y, {selectedOrder.patient?.gender})</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Collection Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{selectedOrder.status}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Assigned Phlebotomist:</span>
                <span className="font-bold text-sky-400">🧑‍⚕️ {selectedOrder.assignedMLT?.name || 'Unassigned'}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Specimen Tests Required:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedOrder.tests?.map((t, idx) => (
                    <span key={idx} className="bg-sky-950 text-sky-300 px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-sky-800/60">
                      🧪 {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Safety Handshake PIN:</span>
                <span className="font-mono font-black text-amber-400 text-sm sm:text-base">{selectedOrder.safetyPin}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2.5">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all"
              >
                Close
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.address?.coordinates?.lat || 14.6819},${selectedOrder.address?.coordinates?.lng || 77.6006}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-xl text-xs text-center transition-all shadow-lg"
              >
                🗺️ Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
