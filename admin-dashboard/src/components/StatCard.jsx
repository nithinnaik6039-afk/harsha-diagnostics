import React from 'react';

export default function StatCard({ title, value, icon, colorClass = 'text-sky-600' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-white mt-2 block">
          {value}
        </span>
      </div>
      <div className={`text-3xl p-3 bg-slate-800 rounded-xl ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
