import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { compressImageFile } from '../utils/helpers';

interface ImageCompressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalFile: File | null;
  onCompressed: (compressedFile: File, dataUrl: string, sizeMb: number) => void;
}

export const ImageCompressionModal: React.FC<ImageCompressionModalProps> = ({
  isOpen,
  onClose,
  originalFile,
  onCompressed,
}) => {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !originalFile) return null;

  const originalSizeMb = Number((originalFile.size / (1024 * 1024)).toFixed(2));

  const handleCompress = async () => {
    setIsCompressing(true);
    setError(null);
    try {
      // Compress to strictly <= 1 MB
      const result = await compressImageFile(originalFile, 950000);
      setIsCompressing(false);
      onCompressed(result.compressedFile, result.dataUrl, result.sizeMb);
      onClose();
    } catch (err: any) {
      setIsCompressing(false);
      setError(err.message || 'Image compression failed. Please try a different photo.');
    }
  };

  return (
    <div id="compression-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div id="compression-modal-container" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-200/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Image Exceeds 1 MB Limit</h3>
            <p className="text-xs text-slate-500">Storage Optimization Required</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Your selected file <span className="font-semibold text-slate-800">({originalSizeMb} MB)</span> exceeds the PG system upload limit of 1.0 MB. We can automatically optimize it while preserving high visual quality.
        </p>

        {/* Size comparison box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-5 flex items-center justify-between text-sm">
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">Original Size</p>
            <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 font-semibold rounded-lg text-xs">
              {originalSizeMb} MB
            </span>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400" />

          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">Optimized Target</p>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> &lt; 0.95 MB
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            id="cancel-compress-btn"
            type="button"
            disabled={isCompressing}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            id="confirm-compress-btn"
            type="button"
            disabled={isCompressing}
            onClick={handleCompress}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Compress & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
