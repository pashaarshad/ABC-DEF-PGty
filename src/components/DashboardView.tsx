import React, { useState } from 'react';
import {
  Users,
  BedDouble,
  CreditCard,
  FileCheck,
  HardDrive,
  TrendingUp,
  AlertCircle,
  Plus,
  Share2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { StorageCard } from './StorageCard';
import { StorageManagerModal } from './StorageManagerModal';

interface DashboardViewProps {
  onOpenInviteModal: () => void;
  onOpenPaymentModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenInviteModal,
  onOpenPaymentModal,
}) => {
  const {
    pgSettings,
    rooms,
    residents,
    applications,
    payments,
    setActiveView,
    setSelectedApplicationId,
    setSelectedResidentId,
  } = usePG();

  const [showStorageModal, setShowStorageModal] = useState(false);

  // Time-based greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good day';
  if (currentHour < 12) greeting = 'Good morning';
  else if (currentHour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  // Bed stats
  const allBeds = rooms.flatMap((r) => r.beds);
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === 'Occupied').length;
  const availableBeds = allBeds.filter((b) => b.status === 'Available').length;
  const maintenanceBeds = allBeds.filter((b) => b.status === 'Maintenance').length;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Applications
  const pendingApps = applications.filter((a) => a.status === 'PENDING');

  // Payments for current month (August 2026)
  const currentMonth = 'August 2026';
  const activeResidents = residents.filter((r) => r.status === 'ACTIVE');
  const expectedCollection = activeResidents.reduce((sum, r) => sum + r.monthlyRent, 0);

  const monthlyPayments = payments.filter(
    (p) => p.billingMonth === currentMonth && p.paymentType === 'Rent'
  );
  const collectedAmount = monthlyPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalDueAmount = Math.max(0, expectedCollection - collectedAmount);

  // List of residents with dues
  const residentsWithDues = activeResidents
    .map((res) => {
      const resPayments = monthlyPayments.filter((p) => p.residentId === res.id);
      const paid = resPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const due = Math.max(0, res.monthlyRent - paid);
      return {
        ...res,
        paidForMonth: paid,
        dueForMonth: due,
        isPartiallyPaid: paid > 0 && due > 0,
      };
    })
    .filter((r) => r.dueForMonth > 0);

  return (
    <div id="dashboard-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Quick Action greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, Admin 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {pgSettings.name} • {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            id="dashboard-quick-invite-btn"
            onClick={onOpenInviteModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Share Link</span>
          </button>
          <button
            id="dashboard-quick-payment-btn"
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total & Occupied Beds */}
        <div
          onClick={() => setActiveView('rooms')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy</span>
            <BedDouble className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {occupiedBeds}/{totalBeds}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {occupancyPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            🟢 {availableBeds} Available • 🟡 {maintenanceBeds} Maint.
          </p>
        </div>

        {/* Active Residents */}
        <div
          onClick={() => setActiveView('residents')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Residents</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{activeResidents.length}</span>
            <span className="text-xs text-slate-400">Tenants</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified KYC records</p>
        </div>

        {/* Pending Applications */}
        <div
          onClick={() => setActiveView('applications')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
            <FileCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingApps.length}</span>
            {pendingApps.length > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                Needs Review
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for room allocation</p>
        </div>

        {/* Total Amount Due */}
        <div
          onClick={() => setActiveView('payments')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</span>
            <CreditCard className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">
              {formatCurrency(totalDueAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {residentsWithDues.length} residents pending
          </p>
        </div>
      </div>

      {/* Row: Payment Overview Card + Storage Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Overview</h3>
                <p className="text-xs text-slate-400">{currentMonth}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('payments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              View Ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Expected</span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                {formatCurrency(expectedCollection)}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-medium text-emerald-700 block mb-0.5">Collected</span>
              <span className="text-sm sm:text-base font-bold text-emerald-700">
                {formatCurrency(collectedAmount)}
              </span>
            </div>
            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              <span className="text-[11px] font-medium text-rose-700 block mb-0.5">Due</span>
              <span className="text-sm sm:text-base font-bold text-rose-700">
                {formatCurrency(totalDueAmount)}
              </span>
            </div>
          </div>

          {/* Collection Progress bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${expectedCollection > 0 ? (collectedAmount / expectedCollection) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {expectedCollection > 0
                ? Math.round((collectedAmount / expectedCollection) * 100)
                : 0}
              % Collected
            </span>
            <span>Due day: 5th of every month</span>
          </div>
        </div>

        {/* Prominent Storage Quota Card (500 MB quota requirement) */}
        <StorageCard onOpenDetails={() => setShowStorageModal(true)} />
      </div>

      {/* Quick Action Button Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            id="qa-invite-resident-btn"
            onClick={onOpenInviteModal}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition shadow-2xs"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Resident</span>
          </button>
          <button
            id="qa-record-payment-btn"
            onClick={onOpenPaymentModal}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition shadow-2xs"
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>+ Payment</span>
          </button>
          <button
            id="qa-share-link-btn"
            onClick={onOpenInviteModal}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition shadow-2xs"
          >
            <Share2 className="w-4 h-4 text-purple-600" />
            <span>Share Link</span>
          </button>
          <button
            id="qa-view-rooms-btn"
            onClick={() => setActiveView('rooms')}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition shadow-2xs"
          >
            <BedDouble className="w-4 h-4 text-amber-600" />
            <span>View Rooms</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Pending Applications & Payment Due Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Applications Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <FileCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Pending Applications ({pendingApps.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveView('applications')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </button>
          </div>

          {pendingApps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All applications reviewed! No pending approvals.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingApps.slice(0, 3).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={app.photoUrl}
                      alt={app.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{app.fullName}</p>
                      <p className="text-slate-500 truncate">{app.occupation}</p>
                      <p className="text-[11px] text-slate-400">
                        {app.mobile} • {formatDate(app.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedApplicationId(app.id);
                      setActiveView('applications');
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition flex-shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Due Attention List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Payment Dues ({residentsWithDues.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveView('payments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Collect
            </button>
          </div>

          {residentsWithDues.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All active resident rents are fully cleared for {currentMonth}!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {residentsWithDues.slice(0, 4).map((res) => (
                <div key={res.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {res.fullName}{' '}
                      <span className="text-[11px] font-normal text-slate-500 font-mono">
                        (Room {res.roomNumber}, {res.bedNumber})
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Monthly: {formatCurrency(res.monthlyRent)} •{' '}
                      {res.paidForMonth > 0 ? (
                        <span className="text-amber-600 font-medium">
                          Paid {formatCurrency(res.paidForMonth)} (Partial)
                        </span>
                      ) : (
                        <span className="text-rose-600">Unpaid</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-rose-600 block">
                      {formatCurrency(res.dueForMonth)} Due
                    </span>
                    <button
                      onClick={() => {
                        setSelectedResidentId(res.id);
                        setActiveView('payments');
                      }}
                      className="text-[11px] text-indigo-600 hover:underline font-medium"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Storage Manager Modal */}
      <StorageManagerModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
      />
    </div>
  );
};
