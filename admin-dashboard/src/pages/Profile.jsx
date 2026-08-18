import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813591-12c4315633a7?w=150&auto=format&fit=crop&q=80',
];

export default function Profile() {
  const { user, token, logout } = useAuthStore();

  const [adminName, setAdminName] = useState('Dr. Harsha Vardhan (Diagnostic Center Director)');
  const [adminEmail, setAdminEmail] = useState('director@harshadiagnostics.com');
  const [adminPhone, setAdminPhone] = useState('+91 94400 12345');
  const [nablLicense, setNablLicense] = useState('NABL-ISO-15189:2022-MC4491');
  const [icmrApproval, setIcmrApproval] = useState('ICMR-AP-ANTP-0992');
  const [cpcbLicense, setCpcbLicense] = useState('APPCB/BMW/ANTP/2024/001');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  const [profilePic, setProfilePic] = useState(
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  );
  const [showModal, setShowModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePic(ev.target.result);
      setShowModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-sky-500/20">
              👑
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                Diagnostic Center Owner & Admin Profile
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Manage center accreditation, NABL licenses, WhatsApp notifications & admin security settings.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-emerald-300 text-xs font-bold animate-in fade-in">
            ✓ Admin Profile & Accreditation Saved!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: WhatsApp-style DP Card & Quick Badges */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative mb-4 group cursor-pointer" onClick={() => setShowModal(true)}>
              <img
                src={profilePic}
                alt="Admin DP"
                className="w-28 h-28 rounded-full object-cover border-4 border-sky-500 shadow-xl shadow-sky-500/20 transition-transform group-hover:scale-105"
              />
              {/* WhatsApp Camera Badge Overlay */}
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-sm shadow-md">
                📷
              </div>
            </div>

            <h3 className="text-lg font-black text-white">{adminName}</h3>
            <p className="text-xs text-sky-400 font-semibold mt-0.5">{adminEmail}</p>
            <p className="text-xs text-slate-400 mt-0.5">{adminPhone}</p>

            <div className="mt-4 px-3 py-1 bg-sky-950/60 border border-sky-800/80 rounded-full text-[11px] font-bold text-sky-300">
              ★ SUPER ADMIN • FULL PRIVILEGES
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              📷 Change Profile Photo (WhatsApp Style)
            </button>
          </div>

          {/* Diagnostic Hub Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Anantapur Central Lab Hub
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase">NABL Accreditation</p>
                <p className="text-sm font-black text-emerald-400 mt-1">ISO 15189</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Active MLTs</p>
                <p className="text-sm font-black text-sky-400 mt-1">3 On-Duty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Accreditation Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-base font-black text-white mb-1">Director & Super Admin Details</h3>
              <p className="text-xs text-slate-400">Owner identity displayed on official diagnostic reports and laboratory accreditations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Director Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Official Direct Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Official Emergency Mobile</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Central Lab Address</label>
                <input
                  type="text"
                  defaultValue="Subhash Road, Clock Tower Circle, Anantapuramu - 515001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-base font-black text-white mb-1">Diagnostic Regulatory Accreditations</h3>
              <p className="text-xs text-slate-400">Clinical certificates and regulatory licenses governing Harsha Diagnostic Centre.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">NABL Registration No.</label>
                <input
                  type="text"
                  value={nablLicense}
                  onChange={(e) => setNablLicense(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">ICMR Approval Code</label>
                <input
                  type="text"
                  value={icmrApproval}
                  onChange={(e) => setIcmrApproval(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">CPCB Biohazard License</label>
                <input
                  type="text"
                  value={cpcbLicense}
                  onChange={(e) => setCpcbLicense(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={twoFactorAuth}
                    onChange={(e) => setTwoFactorAuth(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  2FA Multi-Factor Auth
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={(e) => setWhatsappAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  WhatsApp Owner Alerts
                </label>
              </div>

              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-sky-600/25 active:scale-95"
              >
                💾 Save Profile & Accreditations
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* WhatsApp Fullscreen DP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center w-full mb-4">
              <h4 className="text-base font-black text-white">Owner Profile Photo</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <img
              src={profilePic}
              alt="Admin Large"
              className="w-40 h-40 rounded-full object-cover border-4 border-sky-500 shadow-2xl mb-4"
            />

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Choose Preset Avatar:
            </p>
            <div className="flex gap-3 mb-6">
              {PRESET_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Preset"
                  onClick={() => {
                    setProfilePic(url);
                    setShowModal(false);
                  }}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer border-2 border-sky-500 hover:scale-110 transition-transform"
                />
              ))}
            </div>

            <div className="w-full space-y-2">
              <label className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center block cursor-pointer transition-all shadow-lg shadow-sky-600/30">
                📷 Upload from Device
                <input type="file" accept="image/*" onChange={handlePickFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
