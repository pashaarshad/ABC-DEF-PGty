import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Settings Schema
export interface ISetting {
  name: string;
  type: string;
  address: string;
  contactNumber: string;
  email: string;
  description: string;
  monthlyDueDay: number;
  storageLimitMb: number;
  editPassword?: string;
  reminderSchedule: {
    firstReminderDaysBefore: number;
    secondReminderDaysBefore: number;
    dueDateReminder: boolean;
    overdueReminderDaysAfter: number;
    repeatOverdueDays: number;
    maxReminders: number;
  };
}

export const SettingSchema = new Schema<ISetting>(
  {
    name: { type: String, default: 'ABC DEF Luxury PG & Hostel' },
    type: { type: String, default: 'Gents' },
    address: { type: String, default: '#42, 2nd Main, 7th Cross, Koramangala 4th Block, Bengaluru, Karnataka' },
    contactNumber: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'srisaigentspg78@gmail.com' },
    description: {
      type: String,
      default: 'Premium PG accommodation with high-speed Wi-Fi, 3 times food, daily housekeeping and 24/7 security.',
    },
    monthlyDueDay: { type: Number, default: 5 },
    storageLimitMb: { type: Number, default: 500 },
    editPassword: { type: String, default: '6565' },
    reminderSchedule: {
      firstReminderDaysBefore: { type: Number, default: 2 },
      secondReminderDaysBefore: { type: Number, default: 1 },
      dueDateReminder: { type: Boolean, default: true },
      overdueReminderDaysAfter: { type: Number, default: 1 },
      repeatOverdueDays: { type: Number, default: 3 },
      maxReminders: { type: Number, default: 5 },
    },
  },
  { timestamps: true }
);

// 2. Building Schema
export interface IBuilding {
  id: string;
  name: string;
  description?: string;
}

export const BuildingSchema = new Schema<IBuilding>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

// 3. Floor Schema
export interface IFloor {
  id: string;
  buildingId: string;
  name: string;
  order: number;
}

export const FloorSchema = new Schema<IFloor>(
  {
    id: { type: String, required: true, unique: true, index: true },
    buildingId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 4. Room & Bed Schema
export interface IBed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  residentId?: string;
  residentName?: string;
}

export interface IRoom {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  sharingType: string;
  capacity: number;
  baseRent: number;
  status: string;
  beds: IBed[];
}

const BedSubSchema = new Schema<IBed>(
  {
    id: { type: String, required: true },
    roomId: { type: String, required: true },
    bedNumber: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
    residentId: { type: String },
    residentName: { type: String },
  },
  { _id: false }
);

export const RoomSchema = new Schema<IRoom>(
  {
    id: { type: String, required: true, unique: true, index: true },
    buildingId: { type: String, required: true, index: true },
    floorId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    sharingType: { type: String, default: '3-Sharing' },
    capacity: { type: Number, required: true },
    baseRent: { type: Number, required: true },
    status: { type: String, default: 'Active' },
    beds: [BedSubSchema],
  },
  { timestamps: true }
);

// 5. Resident Application Schema
export interface IApplication {
  id: string;
  invitationToken?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED';
  fullName: string;
  mobile: string;
  email: string;
  gender: string;
  dob?: string;
  permanentAddress: string;
  occupation?: string;
  emergencyContact: {
    relationship: string;
    name: string;
    phone: string;
  };
  photoUrl?: string;
  photoSizeBytes?: number;
  aadharUrl?: string;
  aadharSizeBytes?: number;
  aadharNumberMasked?: string;
  acceptedRulesVersion: string;
  acceptedAt: string;
  submittedAt: string;
  rejectionReason?: string;
  correctionNote?: string;
}

export const ApplicationSchema = new Schema<IApplication>(
  {
    id: { type: String, required: true, unique: true, index: true },
    invitationToken: { type: String, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED'],
      default: 'PENDING',
      index: true,
    },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, default: 'Male' },
    dob: { type: String },
    permanentAddress: { type: String, required: true },
    occupation: { type: String, default: '' },
    emergencyContact: {
      relationship: { type: String, default: 'Father' },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    photoUrl: { type: String, default: '' },
    photoSizeBytes: { type: Number, default: 0 },
    aadharUrl: { type: String, default: '' },
    aadharSizeBytes: { type: Number, default: 0 },
    aadharNumberMasked: { type: String, default: 'XXXX-XXXX-XXXX' },
    acceptedRulesVersion: { type: String, default: 'v1.0 (Aug 2026)' },
    acceptedAt: { type: String, default: () => new Date().toISOString() },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    rejectionReason: { type: String },
    correctionNote: { type: String },
  },
  { timestamps: true }
);

// 6. Resident Schema
export interface IResident {
  id: string;
  applicationId?: string;
  fullName: string;
  mobile: string;
  email: string;
  gender: string;
  permanentAddress: string;
  occupation?: string;
  emergencyContact: {
    relationship: string;
    name: string;
    phone: string;
  };
  photoUrl?: string;
  aadharUrl?: string;
  aadharNumberMasked?: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  roomNumber: string;
  bedNumber: string;
  sharingType: string;
  moveInDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'ACTIVE' | 'NOTICE' | 'VACATED';
  noticeDate?: string;
  vacatedDate?: string;
  createdAt: string;
  notes?: string;
}

export const ResidentSchema = new Schema<IResident>(
  {
    id: { type: String, required: true, unique: true, index: true },
    applicationId: { type: String, default: '' },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, default: 'Male' },
    permanentAddress: { type: String, default: '' },
    occupation: { type: String, default: '' },
    emergencyContact: {
      relationship: { type: String, default: 'Father' },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    photoUrl: { type: String, default: '' },
    aadharUrl: { type: String, default: '' },
    aadharNumberMasked: { type: String, default: 'XXXX-XXXX-XXXX' },
    buildingId: { type: String, required: true },
    floorId: { type: String, required: true },
    roomId: { type: String, required: true },
    bedId: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    sharingType: { type: String, default: '3-Sharing' },
    moveInDate: { type: String, required: true },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'NOTICE', 'VACATED'], default: 'ACTIVE' },
    noticeDate: { type: String },
    vacatedDate: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// 7. Payment Record Schema
export interface IPayment {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  bedNumber: string;
  billingMonth: string;
  totalDueForMonth: number;
  amountPaid: number;
  remainingBalance: number;
  paymentType: 'Rent' | 'Security Deposit' | 'Maintenance' | 'Other';
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
  status: 'Paid' | 'Partially Paid' | 'Due' | 'Overdue';
  transactionReference?: string;
  notes?: string;
  paidAt: string;
  recordedBy: string;
}

export const PaymentSchema = new Schema<IPayment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    residentId: { type: String, required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    billingMonth: { type: String, required: true },
    totalDueForMonth: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    remainingBalance: { type: Number, default: 0 },
    paymentType: { type: String, enum: ['Rent', 'Security Deposit', 'Maintenance', 'Other'], default: 'Rent' },
    paymentMethod: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer', 'Other'], default: 'UPI' },
    status: { type: String, enum: ['Paid', 'Partially Paid', 'Due', 'Overdue'], default: 'Paid' },
    transactionReference: { type: String },
    notes: { type: String },
    paidAt: { type: String, default: () => new Date().toISOString() },
    recordedBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

// 8. Rule Schema
export interface IRule {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Timing' | 'Visitors' | 'Cleanliness' | 'Security' | 'Payment';
  order: number;
  isMandatory: boolean;
}

export const RuleSchema = new Schema<IRule>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['General', 'Timing', 'Visitors', 'Cleanliness', 'Security', 'Payment'],
      default: 'General',
    },
    order: { type: Number, default: 0 },
    isMandatory: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 9. Notification Schema
export interface INotification {
  id: string;
  recipientType: 'ADMIN' | 'TENANT';
  residentId?: string;
  title: string;
  message: string;
  channel: string;
  type: string;
  timestamp: string;
  read: boolean;
  linkUrl?: string;
}

export const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipientType: { type: String, enum: ['ADMIN', 'TENANT'], default: 'ADMIN' },
    residentId: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, default: 'IN_APP' },
    type: { type: String, default: 'APPLICATION' },
    timestamp: { type: String, default: () => new Date().toISOString() },
    read: { type: Boolean, default: false },
    linkUrl: { type: String },
  },
  { timestamps: true }
);

// 10. Storage File Schema
export interface IStorageFile {
  id: string;
  fileName: string;
  fileType: 'PROFILE_PHOTO' | 'AADHAAR_DOCUMENT' | 'RECEIPT' | 'OTHER';
  mimeType: string;
  sizeBytes: number;
  sizeMb: number;
  residentId?: string;
  residentName?: string;
  uploadedAt: string;
  dataUrl?: string;
}

export const StorageFileSchema = new Schema<IStorageFile>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['PROFILE_PHOTO', 'AADHAAR_DOCUMENT', 'RECEIPT', 'OTHER'],
      default: 'PROFILE_PHOTO',
    },
    mimeType: { type: String, default: 'image/jpeg' },
    sizeBytes: { type: Number, required: true },
    sizeMb: { type: Number, required: true },
    residentId: { type: String },
    residentName: { type: String },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
    dataUrl: { type: String },
  },
  { timestamps: true }
);

// 11. Audit Log Schema
export interface IAuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  details?: string;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true },
    actor: { type: String, default: 'Admin' },
    target: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() },
    details: { type: String },
  },
  { timestamps: true }
);

// 12. Invitation Token Schema (For Invite Tenant Links)
export interface IInvitation {
  token: string;
  pgName: string;
  createdAt: string;
  expiresAt?: string;
  used: boolean;
  usedByApplicationId?: string;
}

export const InvitationSchema = new Schema<IInvitation>(
  {
    token: { type: String, required: true, unique: true, index: true },
    pgName: { type: String, default: 'ABC DEF PG' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    expiresAt: { type: String },
    used: { type: Boolean, default: false },
    usedByApplicationId: { type: String },
  },
  { timestamps: true }
);

export const SettingModel: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
export const BuildingModel: Model<IBuilding> =
  mongoose.models.Building || mongoose.model<IBuilding>('Building', BuildingSchema);
export const FloorModel: Model<IFloor> =
  mongoose.models.Floor || mongoose.model<IFloor>('Floor', FloorSchema);
export const RoomModel: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export const ApplicationModel: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
export const ResidentModel: Model<IResident> =
  mongoose.models.Resident || mongoose.model<IResident>('Resident', ResidentSchema);
export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export const RuleModel: Model<IRule> =
  mongoose.models.Rule || mongoose.model<IRule>('Rule', RuleSchema);
export const NotificationModel: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const StorageFileModel: Model<IStorageFile> =
  mongoose.models.StorageFile || mongoose.model<IStorageFile>('StorageFile', StorageFileSchema);
export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const InvitationModel: Model<IInvitation> =
  mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
