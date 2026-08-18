import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Catalog from './pages/Catalog';
import Roster from './pages/Roster';
import Analytics from './pages/Analytics';
import LiveTracking from './pages/LiveTracking';
import Profile from './pages/Profile';

export default function App() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-hidden flex flex-col pt-14 md:pt-0">
          <Routes>
            <Route path="/orders" element={<Orders />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/live-tracking" element={<LiveTracking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
