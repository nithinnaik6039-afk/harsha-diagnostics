import React from 'react';

export default function AuthTabs({
  activeTab,
  setActiveTab,
  tabs = [
    { id: 'password', label: '🔑 Credentials' },
    { id: 'otp', label: '📱 Mobile + OTP' }
  ],
  children
}) {
  return (
    <div className="w-full mb-6">
      {/* Segmented Switcher */}
      <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-1 mb-5 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-slate-800 text-sky-400 shadow-md border border-slate-700/60 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Children */}
      <div className="w-full">
        {typeof children === 'function' ? children(activeTab) : children[activeTab] || children}
      </div>
    </div>
  );
}
