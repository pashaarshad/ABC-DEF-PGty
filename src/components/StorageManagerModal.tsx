import React from 'react';
import { HardDrive, Trash2, X, FileText, Image as ImageIcon, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { usePG } from '../context/PGContext';
import { formatDate } from '../utils/helpers';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose }) => {
  const { storageFiles, totalStorageMb, storagePercentage, storageStatus, deleteStorageFile, pgSettings } = usePG();

  if (!isOpen) return null;

  const maxMb = pgSettings.storageLimitMb || 500;
  const remainingMb = Math.max(0, Number((maxMb - totalStorageMb).toFixed(1)));

  return (
    <div id="storage-manager-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div id="storage-manager-modal-container" className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-200/60">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Application Storage Quota</h3>
            <p className="text-xs text-slate-500">Track KYC documents, photos & backups against {maxMb} MB quota</p>
          </div>
        </div>

        {/* Quota Progress Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div>
              <span className="font-bold text-slate-900 text-lg">{totalStorageMb} MB</span>
              <span className="text-slate-500 font-medium"> / {maxMb} MB Total</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
              {storagePercentage}% Used ({remainingMb} MB Free)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storageStatus === 'FULL'
                  ? 'bg-red-600'
                  : storageStatus === 'CRITICAL'
                  ? 'bg-amber-500'
                  : storageStatus === 'WARNING'
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, storagePercentage))}%` }}
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Quota Type: PG Files & Documents</span>
            <span className="font-medium">
              {storageStatus === 'HEALTHY' && <span className="text-emerald-600">✓ Healthy</span>}
              {storageStatus === 'WARNING' && <span className="text-amber-600">⚠ Warning (80%+)</span>}
              {storageStatus === 'CRITICAL' && <span className="text-amber-600">⚠ Critical (90%+)</span>}
              {storageStatus === 'FULL' && <span className="text-red-600">✕ Full (Uploads blocked)</span>}
            </span>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto min-h-[220px]">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Uploaded Files ({storageFiles.length})
          </h4>

          {storageFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">No uploaded files in storage.</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {storageFiles.map((file) => (
                <div key={file.id} className="p-3 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      {file.fileType === 'PROFILE_PHOTO' || file.fileType === 'AADHAAR_DOCUMENT' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{file.fileName}</p>
                      <p className="text-[11px] text-slate-400">
                        {file.residentName || 'General'} • {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {file.sizeMb} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteStorageFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete file to free space"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>Files are strictly optimized to &le; 1 MB during tenant onboarding.</p>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
