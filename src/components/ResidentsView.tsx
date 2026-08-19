import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Share2,
  Edit2,
  Clock,
  ShieldCheck,
  X,
  AlertCircle,
  CheckCircle2,
  UserX,
  Eye,
  Plus,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { Resident, ResidentStatus } from '../types';
import { formatCurrency, formatDate, calculateStayDuration } from '../utils/helpers';
import { SensitiveEditModal } from './SensitiveEditModal';
import { ShareDetailsModal } from './ShareDetailsModal';

interface ResidentsViewProps {
  onOpenInviteModal: () => void;
  onOpenPaymentModalForResident: (residentId: string) => void;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  onOpenInviteModal,
  onOpenPaymentModalForResident,
}) => {
  const {
    residents,
    payments,
    updateResident,
    changeResidentStatus,
    selectedResidentId,
    setSelectedResidentId,
  } = usePG();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusTab, setStatusTab] = useState<ResidentStatus | 'ALL'>('ACTIVE');

  // Detail drawer / modal
  const activeResident = residents.find((r) => r.id === selectedResidentId) || null;

  // Sensitive edit modal state
  const [showSensitiveModal, setShowSensitiveModal] = useState<boolean>(false);
  const [isEditingResident, setIsEditingResident] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Resident>>({});

  // Share details modal
  const [sharingResident, setSharingResident] = useState<Resident | null>(null);

  // Filtered residents list
  const filteredResidents = residents.filter((r) => {
    if (statusTab !== 'ALL' && r.status !== statusTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.bedNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartEdit = () => {
    if (!activeResident) return;
    setEditFormData({
      fullName: activeResident.fullName,
      mobile: activeResident.mobile,
      email: activeResident.email,
      monthlyRent: activeResident.monthlyRent,
      securityDeposit: activeResident.securityDeposit,
      occupation: activeResident.occupation,
      permanentAddress: activeResident.permanentAddress,
    });
    setShowSensitiveModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResident) return;
    updateResident(activeResident.id, editFormData);
    setIsEditingResident(false);
  };

  return (
    <div id="residents-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Residents Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active tenants, stay duration & payment history
          </p>
        </div>

        <button
          id="residents-invite-btn"
          onClick={onOpenInviteModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Invite New Tenant</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md">
          <button
            onClick={() => setStatusTab('ACTIVE')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
              statusTab === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({residents.filter((r) => r.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setStatusTab('NOTICE')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
              statusTab === 'NOTICE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            On Notice ({residents.filter((r) => r.status === 'NOTICE').length})
          </button>
          <button
            onClick={() => setStatusTab('VACATED')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
              statusTab === 'VACATED'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vacated ({residents.filter((r) => r.status === 'VACATED').length})
          </button>
          <button
            onClick={() => setStatusTab('ALL')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
              statusTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({residents.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <input
            id="resident-search-input"
            type="text"
            placeholder="Search name, room, mobile, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Residents Grid */}
      {filteredResidents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Residents Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search or tab filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResidents.map((res) => {
            const stayDuration = calculateStayDuration(res.moveInDate);
            const resPayments = payments.filter(
              (p) => p.residentId === res.id && p.billingMonth === 'August 2026' && p.paymentType === 'Rent'
            );
            const paid = resPayments.reduce((sum, p) => sum + p.amountPaid, 0);
            const due = Math.max(0, res.monthlyRent - paid);

            return (
              <div
                key={res.id}
                id={`resident-card-${res.id}`}
                onClick={() => setSelectedResidentId(res.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={res.photoUrl}
                        alt={res.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{res.fullName}</h3>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {res.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[170px]">{res.occupation}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        res.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : res.status === 'NOTICE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  {/* Room, Bed & Rent */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500">Room & Bed</span>
                      <span className="font-bold text-slate-800">
                        Room {res.roomNumber} • Bed {res.bedNumber} ({res.sharingType})
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500">Monthly Rent</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(res.monthlyRent)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current Due (Aug)</span>
                      <span
                        className={`font-bold ${
                          due === 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {due === 0 ? '✓ Cleared' : `${formatCurrency(due)} Due`}
                      </span>
                    </div>
                  </div>

                  {/* Stay info */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      Stay: <strong className="text-slate-700">{stayDuration}</strong> (Joined{' '}
                      {formatDate(res.moveInDate)})
                    </span>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{res.mobile}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingResident(res);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Share WhatsApp details"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentModalForResident(res.id);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] transition"
                    >
                      + Payment
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resident Detail Modal / Drawer */}
      {activeResident && (
        <div
          id="resident-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => {
                setSelectedResidentId(null);
                setIsEditingResident(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
              <img
                src={activeResident.photoUrl}
                alt={activeResident.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">{activeResident.fullName}</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                    {activeResident.id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      activeResident.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : activeResident.status === 'NOTICE'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {activeResident.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeResident.occupation}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {activeResident.mobile}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {activeResident.email}
                  </span>
                </div>
              </div>

              {/* Edit Details Button (Passcode 6565 Protected) */}
              <button
                id="edit-resident-details-btn"
                onClick={handleStartEdit}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1 flex-shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>

            {/* Modal Body / Tabs Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {isEditingResident ? (
                /* Edit Form (Unlocked by Passcode) */
                <form onSubmit={handleSaveEdit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-800">Edit Resident Information (Verified)</span>
                    <span className="text-[11px] text-emerald-600 font-medium">✓ Authorized</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        value={editFormData.fullName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Mobile Number</label>
                      <input
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Email / Gmail</label>
                      <input
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Occupation</label>
                      <input
                        value={editFormData.occupation || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        value={editFormData.monthlyRent || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, monthlyRent: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={editFormData.securityDeposit || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, securityDeposit: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={editFormData.permanentAddress || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingResident(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Allocation & Stay Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Room & Fee Configuration
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Room Number:</span>
                      <strong className="text-slate-800">Room {activeResident.roomNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bed Number:</span>
                      <strong className="text-slate-800">
                        Bed {activeResident.bedNumber} ({activeResident.sharingType})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly Rent:</span>
                      <strong className="text-indigo-700 font-bold">
                        {formatCurrency(activeResident.monthlyRent)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Deposit:</span>
                      <strong className="text-slate-800">
                        {formatCurrency(activeResident.securityDeposit)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Stay Duration & KYC
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Move-in Date:</span>
                      <strong className="text-slate-800">{formatDate(activeResident.moveInDate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Stay:</span>
                      <strong className="text-emerald-700 font-semibold">
                        {calculateStayDuration(activeResident.moveInDate)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Aadhaar (Masked):</span>
                      <strong className="font-mono text-slate-700">
                        {activeResident.aadharNumberMasked}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Emergency Contact:</span>
                      <strong className="text-slate-800">
                        {activeResident.emergencyContact.name} ({activeResident.emergencyContact.relationship}) -{' '}
                        {activeResident.emergencyContact.phone}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History Ledger */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs">Payment History & Ledger</h4>
                  <button
                    onClick={() => {
                      onOpenPaymentModalForResident(activeResident.id);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] transition shadow-2xs"
                  >
                    + Record Payment
                  </button>
                </div>

                {payments.filter((p) => p.residentId === activeResident.id).length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">No payment transactions recorded.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {payments
                      .filter((p) => p.residentId === activeResident.id)
                      .map((p) => (
                        <div key={p.id} className="p-3 bg-white flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {formatCurrency(p.amountPaid)}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  p.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {p.status}
                              </span>
                              <span className="text-slate-500 font-medium">({p.paymentType})</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {p.billingMonth} • Paid via {p.paymentMethod} on {formatDate(p.paidAt)}
                            </p>
                          </div>

                          <div className="text-right font-mono text-[11px] text-slate-500">
                            {p.transactionReference && <span>Ref: {p.transactionReference}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Lifecycle Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {activeResident.status === 'ACTIVE' && (
                    <button
                      onClick={() =>
                        changeResidentStatus(
                          activeResident.id,
                          'NOTICE',
                          new Date().toISOString().split('T')[0]
                        )
                      }
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg text-xs transition"
                    >
                      Put on 30-Day Notice
                    </button>
                  )}

                  {activeResident.status !== 'VACATED' && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Vacate resident ${activeResident.fullName}? This will mark status as Vacated and free Bed ${activeResident.bedNumber}.`
                          )
                        ) {
                          changeResidentStatus(
                            activeResident.id,
                            'VACATED',
                            undefined,
                            new Date().toISOString().split('T')[0]
                          );
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition"
                    >
                      Mark as Vacated (Free Bed)
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSharingResident(activeResident)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Edit Passcode Verification Modal */}
      <SensitiveEditModal
        isOpen={showSensitiveModal}
        onClose={() => setShowSensitiveModal(false)}
        onVerified={() => {
          setIsEditingResident(true);
        }}
      />

      {/* Share Modal */}
      <ShareDetailsModal
        isOpen={Boolean(sharingResident)}
        onClose={() => setSharingResident(null)}
        resident={sharingResident}
      />
    </div>
  );
};
