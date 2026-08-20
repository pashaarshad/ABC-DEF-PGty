import React, { useState } from 'react';
import {
  Building2,
  Bell,
  User,
  Share2,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { usePG } from '../context/PGContext';

interface NavbarProps {
  onOpenInviteModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenInviteModal }) => {
  const {
    pgSettings,
    rooms,
    notifications,
    activeView,
    setActiveView,
    resetToDemoData,
    isDbOnline,
    setPublicPortalMode,
  } = usePG();

  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Total beds & occupancy
  const allBeds = rooms.flatMap((r) => r.beds);
  const occupiedBeds = allBeds.filter((b) => b.status === 'Occupied').length;
  const totalBeds = allBeds.length;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & PG Title */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveView('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                  {pgSettings.name}
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {pgSettings.type} PG
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-500 hidden sm:block">PG Management System</p>
                {/* Live MongoDB Status Indicator */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                  <Database className="w-2.5 h-2.5 text-emerald-600" />
                  <span>MongoDB Live</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right quick badges & actions */}
          <div className="flex items-center gap-2.5">
            {/* Live Occupancy Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 font-medium">
                {occupiedBeds}/{totalBeds} Beds
              </span>
              <span className="text-slate-400 font-mono">({occupancyPercent}%)</span>
            </div>

            {/* Quick Invite Link */}
            <button
              id="navbar-invite-btn"
              onClick={onOpenInviteModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Tenant</span>
            </button>

            {/* Notification Bell */}
            <button
              id="navbar-notifications-btn"
              onClick={() => setActiveView('dashboard')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* View Switcher / Quick Demo Portal */}
            <div className="relative">
              <button
                id="portal-switch-dropdown-btn"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Admin Mode</span>
              </button>

              {showQuickMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowQuickMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Role Switcher
                    </p>
                    <p className="text-xs font-bold text-slate-800">Admin Control Panel</p>
                  </div>

                  <button
                    onClick={() => {
                      setPublicPortalMode(false);
                      setActiveView('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Admin Dashboard</span>
                  </button>

                  <button
                    onClick={() => setPublicPortalMode(true)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    <span>Tenant Onboarding Portal</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      if (confirm('Reset demo database to original initial records?')) {
                        resetToDemoData();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Records</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
