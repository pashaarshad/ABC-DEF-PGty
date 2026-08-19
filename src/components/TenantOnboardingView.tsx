import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Camera,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Upload,
  RefreshCw,
  Eye,
  Check,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageCompressionModal } from './ImageCompressionModal';
import { maskAadharNumber, compressImageFile } from '../utils/helpers';

interface TenantOnboardingViewProps {
  onBackToAdmin?: () => void;
}

export const TenantOnboardingView: React.FC<TenantOnboardingViewProps> = ({ onBackToAdmin }) => {
  const { pgSettings, rules, submitApplication } = usePG();

  // Multi-step progress (Step 1: Personal, Step 2: KYC & Photo, Step 3: Rules & Submit, Step 4: Success)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [occupation, setOccupation] = useState<string>('');
  const [workplace, setWorkplace] = useState<string>('');
  const [permanentAddress, setPermanentAddress] = useState<string>('');

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyRelation, setEmergencyRelation] = useState<string>('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');

  // Step 2: KYC & Photos
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoSize, setPhotoSize] = useState<number>(0);
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [aadharFrontUrl, setAadharFrontUrl] = useState<string>('');
  const [aadharFrontSize, setAadharFrontSize] = useState<number>(0);
  const [aadharBackUrl, setAadharBackUrl] = useState<string>('');
  const [aadharBackSize, setAadharBackSize] = useState<number>(0);

  // Modals for camera & compression
  const [cameraModalTarget, setCameraModalTarget] = useState<'photo' | 'aadharFront' | 'aadharBack' | null>(null);
  const [compressingFile, setCompressingFile] = useState<File | null>(null);
  const [compressTarget, setCompressTarget] = useState<'photo' | 'aadharFront' | 'aadharBack' | null>(null);

  // Step 3: Rules Acceptance
  const [acceptedRules, setAcceptedRules] = useState<Record<string, boolean>>({});
  const [agreedToAll, setAgreedToAll] = useState<boolean>(false);

  // Step 4: Success Result
  const [submittedAppId, setSubmittedAppId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle image capture from CameraCaptureModal
  const handleCameraCapture = (dataUrl: string, fileSizeBytes: number) => {
    if (cameraModalTarget === 'photo') {
      setPhotoUrl(dataUrl);
      setPhotoSize(fileSizeBytes);
    } else if (cameraModalTarget === 'aadharFront') {
      setAadharFrontUrl(dataUrl);
      setAadharFrontSize(fileSizeBytes);
    } else if (cameraModalTarget === 'aadharBack') {
      setAadharBackUrl(dataUrl);
      setAadharBackSize(fileSizeBytes);
    }
    setCameraModalTarget(null);
  };

  // Handle direct file upload with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'photo' | 'aadharFront' | 'aadharBack') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Open compression preview if file > 1MB or optimize
    setCompressTarget(target);
    setCompressingFile(file);
  };

  const handleCompressionComplete = (dataUrl: string, compressedSizeBytes: number) => {
    if (compressTarget === 'photo') {
      setPhotoUrl(dataUrl);
      setPhotoSize(compressedSizeBytes);
    } else if (compressTarget === 'aadharFront') {
      setAadharFrontUrl(dataUrl);
      setAadharFrontSize(compressedSizeBytes);
    } else if (compressTarget === 'aadharBack') {
      setAadharBackUrl(dataUrl);
      setAadharBackSize(compressedSizeBytes);
    }
    setCompressingFile(null);
    setCompressTarget(null);
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToAll) {
      alert('Please check the agreement box to accept all PG rules.');
      return;
    }

    setIsSubmitting(true);

    try {
      const emergencyRel =
        emergencyRelation === 'Parent'
          ? 'Father'
          : (emergencyRelation as any);

      const appId = await submitApplication({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        dob,
        gender,
        occupation: occupation.trim() + (workplace ? ` at ${workplace.trim()}` : ''),
        permanentAddress: permanentAddress.trim(),
        emergencyContact: {
          name: emergencyName.trim(),
          relationship: emergencyRel,
          phone: emergencyPhone.trim(),
        },
        photoUrl:
          photoUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        photoSizeBytes: photoSize || 120000,
        aadharNumberMasked: maskAadharNumber(aadharNumber),
        aadharUrl:
          aadharFrontUrl ||
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        aadharSizeBytes: (aadharFrontSize || 250000) + (aadharBackSize || 240000),
        acceptedRulesVersion: 'v1.0 (Aug 2026)',
        acceptedAt: new Date().toISOString(),
      });

      setSubmittedAppId(appId);
      setCurrentStep(4);
    } catch (err: any) {
      alert(err.message || 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 font-sans">
      {/* Top Banner & PG Header */}
      <div className="bg-slate-900 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-black text-white text-base shadow-sm">
                PG
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight">
                  {pgSettings.name}
                </h1>
                <p className="text-xs text-slate-300">Tenant Self-Onboarding Portal</p>
              </div>
            </div>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Admin Panel →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 mt-6">
        {/* Step Indicator (Steps 1 to 3) */}
        {currentStep < 4 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs mb-6">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span
                className={`flex items-center gap-1.5 ${
                  currentStep === 1 ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === 1
                      ? 'bg-indigo-600 text-white'
                      : currentStep > 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <span>Personal</span>
              </span>

              <div className="flex-1 h-0.5 bg-slate-100 mx-2" />

              <span
                className={`flex items-center gap-1.5 ${
                  currentStep === 2 ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === 2
                      ? 'bg-indigo-600 text-white'
                      : currentStep > 2
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <span>KYC & Photo</span>
              </span>

              <div className="flex-1 h-0.5 bg-slate-100 mx-2" />

              <span
                className={`flex items-center gap-1.5 ${
                  currentStep === 3 ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep === 3
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  3
                </span>
                <span>Rules & Agree</span>
              </span>
            </div>
          </div>
        )}

        {/* STEP 1: Personal & Emergency Contact */}
        {currentStep === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!fullName || !mobile || !email) {
                alert('Please fill all required personal details');
                return;
              }
              setCurrentStep(2);
            }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 animate-in fade-in"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Provide accurate legal details for registration</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name (as on Govt ID) *
              </label>
              <input
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email / Gmail *
                </label>
                <input
                  required
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Occupation / College
                </label>
                <input
                  placeholder="e.g. Software Engineer / Student"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Workplace / Company
                </label>
                <input
                  placeholder="e.g. Infosys, Manyata Park"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Permanent Home Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House No, Street, City, State, Pincode"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Emergency Contact */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Emergency Contact (Parent / Guardian)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Name</label>
                  <input
                    required
                    placeholder="e.g. Suresh Sharma"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
                  <select
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9811223344"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <span>Continue to KYC & Photo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: KYC & Photo */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-900">KYC Verification & Photos</h2>
              <p className="text-xs text-slate-500">
                Camera capture or gallery upload. Auto-compressed under 1MB.
              </p>
            </div>

            {/* Profile Photo */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tenant Profile Photo *
              </label>
              <p className="text-[11px] text-slate-500 mb-3">Clear face photo for PG register</p>

              <div className="flex items-center gap-4">
                {photoUrl ? (
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full text-[10px]">
                      ✓
                    </span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraModalTarget('photo')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Live Selfie / Camera</span>
                  </button>

                  <label className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>Choose from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Aadhaar Card Number *
              </label>
              <input
                required
                maxLength={14}
                placeholder="12-digit Aadhaar (e.g. 5432 1098 7654)"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-wider focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Masked representation will appear as: {maskAadharNumber(aadharNumber)}
              </p>
            </div>

            {/* Front & Back Aadhaar Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Aadhaar Front Side *
                </label>
                {aadharFrontUrl ? (
                  <div className="relative mb-2">
                    <img
                      src={aadharFrontUrl}
                      alt="Front"
                      className="w-full h-24 object-cover rounded-lg border border-emerald-300"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      ✓ Uploaded ({(aadharFrontSize / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="h-20 bg-slate-200/60 rounded-lg flex items-center justify-center text-slate-400 text-xs mb-2">
                    Front Photo
                  </div>
                )}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCameraModalTarget('aadharFront')}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                  <label className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'aadharFront')}
                    />
                  </label>
                </div>
              </div>

              {/* Back */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Aadhaar Back Side *
                </label>
                {aadharBackUrl ? (
                  <div className="relative mb-2">
                    <img
                      src={aadharBackUrl}
                      alt="Back"
                      className="w-full h-24 object-cover rounded-lg border border-emerald-300"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      ✓ Uploaded ({(aadharBackSize / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="h-20 bg-slate-200/60 rounded-lg flex items-center justify-center text-slate-400 text-xs mb-2">
                    Back Photo
                  </div>
                )}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCameraModalTarget('aadharBack')}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                  <label className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'aadharBack')}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!aadharNumber) {
                    alert('Please enter your Aadhaar number.');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <span>Proceed to Rules & Agreement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Rules & Regulations Acceptance */}
        {currentStep === 3 && (
          <form
            onSubmit={handleSubmitApplication}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 animate-in fade-in"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {pgSettings.name} Rules & Policies
              </h2>
              <p className="text-xs text-slate-500">
                Please review and accept all mandatory PG hostel regulations
              </p>
            </div>

            {/* Rules list */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {rules.map((r, i) => (
                <div
                  key={r.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {i + 1}. {r.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>

            {/* Master Acceptance Checkbox */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToAll}
                  onChange={(e) => setAgreedToAll(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 mt-0.5 focus:ring-indigo-500"
                />
                <span className="text-xs text-indigo-950 leading-relaxed font-medium">
                  I hereby confirm that all information provided is true and accurate. I explicitly agree to follow all rules, curfew timings, and payment terms of {pgSettings.name}.
                </span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !agreedToAll}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit KYC Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success & Reference ID */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Application Received!
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Welcome, {fullName}!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your onboarding application has been submitted to the management of {pgSettings.name}.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Application Reference ID:</span>
                <strong className="font-mono text-indigo-700">{submittedAppId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Number:</span>
                <strong className="font-mono text-slate-800">{mobile}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aadhaar (Masked):</span>
                <strong className="font-mono text-slate-800">{maskAadharNumber(aadharNumber)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Under Admin Review
                </span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 text-left max-w-sm mx-auto">
              <p className="font-semibold mb-0.5">What happens next?</p>
              <p className="text-[11px] text-indigo-700">
                The PG manager will verify your ID documents, allocate your room & bed, and send your official Resident ID and check-in confirmation via WhatsApp and Email.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Print / Save Receipt
              </button>

              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
                >
                  Return to Admin Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {cameraModalTarget && (
        <CameraCaptureModal
          isOpen={Boolean(cameraModalTarget)}
          onClose={() => setCameraModalTarget(null)}
          onCapture={handleCameraCapture}
          title={
            cameraModalTarget === 'photo'
              ? 'Take Profile Photo'
              : cameraModalTarget === 'aadharFront'
              ? 'Capture Aadhaar Card Front'
              : 'Capture Aadhaar Card Back'
          }
        />
      )}

      {/* Image Compression Preview Modal */}
      {compressingFile && (
        <ImageCompressionModal
          isOpen={Boolean(compressingFile)}
          onClose={() => setCompressingFile(null)}
          originalFile={compressingFile}
          onCompressComplete={handleCompressionComplete}
        />
      )}
    </div>
  );
};
