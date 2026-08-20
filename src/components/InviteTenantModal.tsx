import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, MessageCircle, ExternalLink, X, QrCode, Sparkles } from 'lucide-react';
import { usePG } from '../context/PGContext';
import { getWhatsAppShareUrl } from '../utils/helpers';

interface InviteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPortalDirectly?: () => void;
}

export const InviteTenantModal: React.FC<InviteTenantModalProps> = ({
  isOpen,
  onClose,
  onOpenPortalDirectly,
}) => {
  const { pgSettings, generateInvitationLink, setPublicPortalMode, setOnboardingToken } = usePG();
  const [copied, setCopied] = useState<boolean>(false);
  const [inviteData, setInviteData] = useState<{ token: string; link: string }>(() => generateInvitationLink());

  useEffect(() => {
    if (isOpen) {
      setInviteData(generateInvitationLink());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const whatsappMessage = `Hello! 👋

Welcome to ${pgSettings.name}.

Please complete your digital onboarding & room allocation KYC through our portal:

👉 ${inviteData.link}

Key Steps:
1. Fill Personal & Emergency Contacts
2. Take Live Selfie & Upload Aadhaar Card (Compressed < 1MB)
3. Accept PG Rules & Submit

Thank you!
${pgSettings.name} Management`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteData.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenOnboarding = () => {
    setOnboardingToken(inviteData.token);
    if (onOpenPortalDirectly) {
      onOpenPortalDirectly();
    } else {
      setPublicPortalMode(true);
      onClose();
    }
  };

  return (
    <div
      id="invite-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="invite-modal-container"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-200/60">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Invite New Resident</h3>
            <p className="text-xs text-slate-500">Live Tenant Onboarding Link</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Share this unique invitation link with prospective tenants. They will accept PG rules, input emergency contacts, and upload verified camera KYC under 1 MB. All applications sync to MongoDB in real-time.
        </p>

        {/* Link box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
          <input
            readOnly
            value={inviteData.link}
            className="bg-transparent text-xs text-slate-800 font-mono flex-1 outline-none truncate selection:bg-indigo-500 selection:text-white"
          />
          <button
            id="copy-invite-link-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* QR info banner */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
          <QrCode className="w-8 h-8 text-indigo-600 shrink-0" />
          <div className="text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">Direct Invitation Active:</span> Token <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">{inviteData.token}</span> ready for tenant self-onboarding.
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            id="invite-whatsapp-btn"
            href={getWhatsAppShareUrl('', whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>

          <button
            id="preview-onboarding-btn"
            onClick={handleOpenOnboarding}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Portal Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
