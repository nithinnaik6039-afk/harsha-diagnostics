import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const [theme, setTheme] = useState('midnight');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('harsha_admin_theme') || 'midnight';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('harsha_admin_theme', t);
    if (t === 'ocean') {
      document.body.style.background = 'radial-gradient(circle at 50% 0%, #03203c 0%, #020e1f 60%, #01070e 100%)';
    } else if (t === 'emerald') {
      document.body.style.background = 'radial-gradient(circle at 50% 0%, #062e24 0%, #02140f 60%, #010806 100%)';
    } else {
      document.body.style.background = 'radial-gradient(circle at 50% 0%, #0c192c 0%, #030712 60%, #010409 100%)';
    }
  };

  const navItems = [
    { to: '/orders', label: 'Orders Board', icon: '📋', badge: 'Live' },
    { to: '/live-tracking', label: 'Fleet Live Map', icon: '🗺️', badge: 'GPS' },
    { to: '/analytics', label: 'Analytics & Reports', icon: '📊', badge: 'KPI' },
    { to: '/catalog', label: 'Test Catalog', icon: '🧪' },
    { to: '/roster', label: 'Staff Roster', icon: '🧑‍⚕️' },
    { to: '/profile', label: 'Owner Profile', icon: '👑', badge: 'NABL' },
  ];

  return (
    <>
      {/* 📱 Mobile Top Header Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-base shadow-md shadow-sky-500/20">
            🩸
          </div>
          <div>
            <h1 className="text-sm font-black text-white">Harsha Diagnostics</h1>
            <span className="text-[9px] font-bold text-sky-400 uppercase">Command Center</span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-lg hover:bg-slate-800"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 🖥️ Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950/90 text-slate-100 flex-col h-screen border-r border-slate-800/80 backdrop-blur-2xl relative z-20 shadow-2xl shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-400 to-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-sky-500/25 ring-2 ring-sky-500/30">
              🩸
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-snug">
                Harsha Diagnostics
              </h1>
              <span className="text-[10px] font-extrabold text-sky-400 block tracking-wider uppercase">
                Pro Command Center
              </span>
            </div>
          </div>
        </div>

        {/* Theme Switcher Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              🎨 Pro Theme
            </span>
            <span className="text-[9px] font-bold text-sky-400 uppercase">
              {theme}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'midnight', label: '🌌 Dark' },
              { id: 'ocean', label: '🌊 Ocean' },
              { id: 'emerald', label: '🌿 Mint' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`text-[9px] font-bold py-1 px-1.5 rounded-lg border transition-all ${
                  theme === t.id
                    ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Supervision Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-xl shadow-sky-500/25 scale-[1.02] border border-sky-400/40'
                    : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-100 hover:translate-x-1 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-sky-950 text-sky-300 border border-sky-800/80">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System Status & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
          <div className="px-3 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-300">Server Online</span>
            </div>
            <span className="text-[10px] font-mono font-black text-emerald-400">:5005</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 py-2.5 px-4 rounded-2xl text-xs font-black transition-all border border-slate-800 hover:border-rose-900/80 active:scale-95 shadow-md"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex">
          <div className="w-72 bg-slate-950 h-full border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-lg">
                    🩸
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Harsha Diagnostics</h2>
                    <span className="text-[9px] font-bold text-sky-400 uppercase">Command Center</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Theme Selector */}
              <div className="my-4 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">Theme</div>
                <div className="grid grid-cols-3 gap-1">
                  {['midnight', 'ocean', 'emerald'].map((t) => (
                    <button
                      key={t}
                      onClick={() => applyTheme(t)}
                      className={`text-[9px] font-bold py-1 rounded capitalize ${
                        theme === t ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-950 text-sky-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-rose-950/40 text-rose-300 border border-rose-900/60 py-2.5 rounded-xl text-xs font-bold mt-4"
            >
              🚪 Sign Out
            </button>
          </div>

          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
