import React from 'react';
import {
  LayoutDashboard,
  Building,
  BedDouble,
  Users,
  FileCheck,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  HardDrive,
  Share2,
} from 'lucide-react';
import { usePG } from '../context/PGContext';

interface DesktopSidebarProps {
  onOpenInviteModal?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenInviteModal }) => {
  const { activeView, setActiveView, applications, notifications, totalStorageMb, pgSettings } = usePG();

  const pendingAppsCount = applications.filter((a) => a.status === 'PENDING').length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms & Beds', icon: BedDouble },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'applications', label: 'Applications', icon: FileCheck, badge: pendingAppsCount },
    { id: 'payments', label: 'Fees & Payments', icon: CreditCard },
    { id: 'rules', label: 'Rules & Regulations', icon: BookOpen },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs },
    { id: 'settings', label: 'PG Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex-shrink-0">
      {/* Quick Invite Tenant Button */}
      <button
        id="sidebar-invite-btn"
        onClick={onOpenInviteModal}
        className="w-full mb-4 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
      >
        <Share2 className="w-4 h-4" />
        <span>+ Invite New Resident</span>
      </button>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Storage Mini Gauge at Bottom of Sidebar */}
      <div
        onClick={() => setActiveView('settings')}
        className="mt-auto pt-3 border-t border-slate-100 cursor-pointer group"
      >
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 group-hover:border-indigo-200 transition">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 mb-1.5">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span>Storage Quota</span>
            </span>
            <span className="font-semibold text-slate-900">
              {totalStorageMb}/{pgSettings.storageLimitMb || 500} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (totalStorageMb / (pgSettings.storageLimitMb || 500)) * 100
                )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Application file limit</p>
        </div>
      </div>
    </aside>
  );
};
