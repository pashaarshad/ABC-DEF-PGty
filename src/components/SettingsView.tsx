import React, { useState } from 'react';
import {
  Settings,
  Building,
  Phone,
  Mail,
  MapPin,
  Lock,
  HardDrive,
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { PGSettings } from '../types';
import { SensitiveEditModal } from './SensitiveEditModal';
import { StorageManagerModal } from './StorageManagerModal';

export const SettingsView: React.FC = () => {
  const { pgSettings, updatePGSettings, storageFiles, totalStorageMb, storagePercentage } = usePG();

  const [formData, setFormData] = useState<PGSettings>({ ...pgSettings });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showStorageModal, setShowStorageModal] = useState<boolean>(false);

  // Passcode verification for sensitive changes
  const [showSensitiveModal, setShowSensitiveModal] = useState<boolean>(false);
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasscodeUnlocked) {
      setShowSensitiveModal(true);
      return;
    }

    updatePGSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePasscodeVerified = () => {
    setIsPasscodeUnlocked(true);
    updatePGSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="settings-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            PG Settings & Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Property profile, contact info, security passcode & storage quota
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Property Profile</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">PG / Property Name</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tagline</label>
              <input
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Primary Mobile / WhatsApp</label>
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
                <input
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Physical Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pincode</label>
                <input
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Passcode Protection setting */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Admin Sensitive Passcode</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Used to unlock edits to active resident fees, bed de-allocation, and structural changes. (Default: 6565)
              </p>

              <div className="max-w-xs">
                <label className="block text-xs font-medium text-slate-700 mb-1">Passcode (4 Digits)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={formData.adminPasscode}
                  onChange={(e) => setFormData({ ...formData, adminPasscode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Property Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Storage & System Tools */}
        <div className="space-y-4">
          {/* Storage Quota Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Storage Usage</span>
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Occupied Storage</span>
                <span className="font-bold text-slate-900">
                  {totalStorageMb.toFixed(1)} MB / {pgSettings.storageLimitMb || 500} MB
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{
                    width: `${Math.min(100, storagePercentage)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {storageFiles.length} KYC documents & photos saved. All uploaded images are compressed under 1MB.
              </p>
            </div>

            <button
              onClick={() => setShowStorageModal(true)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Open Storage Manager
            </button>
          </div>

          {/* Reset / Backup Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Data Persistence Notice</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              All resident details, bed allocations, KYC documents, and payment records are saved automatically to your device local storage.
            </p>
            <button
              onClick={() => {
                if (confirm('Reset application to default mock demo data?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-xs transition"
            >
              Reset to Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Sensitive verification modal */}
      <SensitiveEditModal
        isOpen={showSensitiveModal}
        onClose={() => setShowSensitiveModal(false)}
        onVerified={handlePasscodeVerified}
      />

      {/* Storage modal */}
      <StorageManagerModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
      />
    </div>
  );
};
