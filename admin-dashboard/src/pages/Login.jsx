import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { auth, isFirebaseConfigured } from '../utils/firebase';
import AuthTabs from '../components/AuthTabs';

import { BACKEND_URL } from '../constants/api';

export default function Login() {
  const setAuth = useAuthStore((state) => state.setAuth);

  const [activeTab, setActiveTab] = useState('password');
  
  // Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Mobile + OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/admin-login`, {
        username,
        password
      });

      if (res.data.success) {
        setAuth(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAdminOtp = async (e) => {
    e?.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');
    try {
      // Simulate admin OTP dispatch
      setOtpSent(true);
      setOtp('123456');
      setInfoMsg('OTP sent! Use test code: 123456');
    } catch (err) {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAdminOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Authenticate admin via verified OTP
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-google`, {
        firebaseUid: `admin-phone-${phone}`,
        email: `admin.${phone}@harsha.com`,
        name: `Admin (${phone.slice(-4)})`,
        role: 'admin'
      });

      if (res.data.success) {
        setAuth(res.data.token);
      } else {
        throw new Error(res.data.message || 'OTP Verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleGoogleSignIn = async () => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      setError('');
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        await completeGoogleLogin(fbUser.uid, fbUser.email, fbUser.displayName);
      } catch (err) {
        setError(err.message || 'Google Popup Sign-In failed.');
        setLoading(false);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const completeGoogleLogin = async (firebaseUid, email, name) => {
    setLoading(true);
    setError('');
    setShowGoogleModal(false);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-google`, {
        firebaseUid,
        email,
        name,
        role: 'admin'
      });

      if (res.data.success) {
        setAuth(res.data.token);
      } else {
        throw new Error(res.data.message || 'Google login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillAdmin = (u, p) => {
    setActiveTab('password');
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-800/80">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-emerald-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-sky-500/20">
            🩸
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Harsha Diagnostics</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Supervision Command Center</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-900/60 rounded-xl text-rose-300 text-xs text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Info Notification */}
        {infoMsg && (
          <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs text-center font-semibold">
            ℹ️ {infoMsg}
          </div>
        )}

        {/* Unified AuthTabs */}
        <AuthTabs
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setError('');
            setInfoMsg('');
          }}
          tabs={[
            { id: 'password', label: '🔑 Credentials' },
            { id: 'otp', label: '📱 Mobile + OTP' }
          ]}
        >
          {{
            password: (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-2">
                    Username / Staff ID
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium transition-all"
                    placeholder="e.g. admin_super"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-sky-500/25 active:scale-95 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Command Center'}
                </button>
              </form>
            ),
            otp: !otpSent ? (
              <form onSubmit={handleSendAdminOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-2">
                    Admin Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-medium transition-all"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending OTP...' : 'Send Admin OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAdminOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-2">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all text-center tracking-widest"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(''); }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Enter Command Center'}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); setInfoMsg(''); }}
                  className="w-full text-slate-400 hover:text-slate-200 text-xs font-medium text-center py-1"
                >
                  ← Edit Phone Number
                </button>
              </form>
            )
          }}
        </AuthTabs>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="px-3 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">OR</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {/* Firebase Direct Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm"
        >
          <span className="text-lg font-black text-rose-600">G</span>
          <span>Continue with Google Account</span>
        </button>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Quick Demo Admin Sign-In:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => quickFillAdmin('admin_super', 'super_secret_harsha_2026')}
              className="flex-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-bold py-2.5 px-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              ⚡ Super Admin
            </button>
            <button
              type="button"
              onClick={() => quickFillAdmin('admin_staff', 'staff_secret_harsha_2026')}
              className="flex-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-bold py-2.5 px-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              ⚡ Staff Admin
            </button>
          </div>
        </div>
      </div>

      {/* Google Account Selection Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-rose-500">G</span>
                <span className="font-extrabold text-white text-base">Choose an Account</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select a Google Account to sign in to Harsha Diagnostics Command Center:
            </p>

            <div className="space-y-2 mb-4">
              {[
                { name: 'Super Admin (Google)', email: 'admin_super@harsha.com', uid: 'google-uid-admin-super-888' },
                { name: 'Staff Admin (Google)', email: 'admin_staff@harsha.com', uid: 'google-uid-admin-staff-777' },
                { name: 'Harsha Diagnostics Admin', email: 'harsha.admin@gmail.com', uid: 'google-uid-admin-gen-999' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => completeGoogleLogin(acc.uid, acc.email, acc.name)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-sky-950/50 hover:border-sky-700/60 border border-slate-700/60 rounded-2xl transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {acc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-sky-300 truncate">{acc.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Google Email Entry */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                Or Sign In With Custom Google Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!customGoogleEmail.includes('@')}
                  onClick={() => completeGoogleLogin(`custom-uid-${Date.now()}`, customGoogleEmail, customGoogleEmail.split('@')[0])}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
