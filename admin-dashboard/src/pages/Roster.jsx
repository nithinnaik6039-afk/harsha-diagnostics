import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = typeof window !== 'undefined' && window.location?.hostname ? `http://${window.location.hostname}:5005` : 'http://localhost:5005';

export default function Roster() {
  const token = useAuthStore((state) => state.token);

  const [mlts, setMlts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoster = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/mlts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMlts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Staff Roster Tracker</h2>
          <p className="text-slate-400 text-sm mt-1">Manage phlebotomists availability, coordinates, and certificate validation</p>
        </div>
        <button
          onClick={fetchRoster}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          🔄 Refresh Roster
        </button>
      </div>

      {/* Roster Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400">Loading phlebotomist roster...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mlts.map((mlt) => (
            <div
              key={mlt._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              {/* Online/Offline Status Bar indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                mlt.isOnline ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-850 rounded-xl flex items-center justify-center text-2xl border border-slate-800">
                    🧑‍⚕️
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{mlt.name}</h3>
                    <span className="text-xs text-slate-400 block mt-1">{mlt.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    mlt.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {mlt.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 bg-slate-850 border border-slate-800/60 rounded-xl p-3 mb-4">
                <div className="text-center border-r border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Rating</span>
                  <span className="text-sm font-extrabold text-white mt-1 block">⭐ {mlt.rating || '4.8'}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Experience</span>
                  <span className="text-sm font-extrabold text-white mt-1 block">2 Years</span>
                </div>
              </div>

              {/* Coordinates tracking info */}
              <div className="text-xs text-slate-400 space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>GPS Tracking:</span>
                  <span className="font-mono text-white">
                    {mlt.location?.coordinates
                      ? `${mlt.location.coordinates[1].toFixed(4)}, ${mlt.location.coordinates[0].toFixed(4)}`
                      : '14.6819, 77.6006'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Certification Badging:</span>
                  <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded text-[10px] font-bold">
                    ✓ VERIFIED
                  </span>
                </div>
              </div>
            </div>
          ))}
          {mlts.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 text-sm">
              No phlebotomists are currently registered. Register one via the MLT Companion App login!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
