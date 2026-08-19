import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PGSettings,
  Building,
  Floor,
  Room,
  Resident,
  ResidentApplication,
  PaymentRecord,
  PaymentStatus,
  Rule,
  NotificationItem,
  StorageFile,
  AuditLog,
  BedStatus,
  ResidentStatus,
  PaymentMethod,
  PaymentType,
  SharingType,
} from '../types';
import {
  initialPGSettings,
  initialBuildings,
  initialFloors,
  initialRooms,
  initialResidents,
  initialApplications,
  initialPayments,
  initialRules,
  initialStorageFiles,
  initialNotifications,
  initialAuditLogs,
} from '../data/initialData';

interface AllocationData {
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  monthlyRent: number;
  securityDeposit: number;
  moveInDate: string;
  notes?: string;
}

export interface PaymentSubmissionData {
  residentId: string;
  billingMonth: string;
  totalDueForMonth: number;
  amountPaid: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

interface PGContextType {
  pgSettings: PGSettings;
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  residents: Resident[];
  applications: ResidentApplication[];
  payments: PaymentRecord[];
  rules: Rule[];
  notifications: NotificationItem[];
  storageFiles: StorageFile[];
  auditLogs: AuditLog[];
  activeView: string;
  selectedResidentId: string | null;
  selectedApplicationId: string | null;
  tenantPortalResidentId: string | null;
  onboardingToken: string | null;
  isAdminLoggedIn: boolean;
  isPublicPortalMode: boolean;

  // Storage metrics
  totalStorageBytes: number;
  totalStorageMb: number;
  storagePercentage: number;
  storageStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'FULL';
  isStorageFull: boolean;

  // View navigation
  setActiveView: (view: string) => void;
  setSelectedResidentId: (id: string | null) => void;
  setSelectedApplicationId: (id: string | null) => void;
  setTenantPortalResidentId: (id: string | null) => void;
  setOnboardingToken: (token: string | null) => void;
  setIsAdminLoggedIn: (val: boolean) => void;
  setPublicPortalMode: (val: boolean) => void;

  // Actions
  updatePGSettings: (settings: Partial<PGSettings>) => void;
  addBuilding: (name: string, description?: string) => string;
  editBuilding: (id: string, name: string, description?: string) => void;
  deleteBuilding: (id: string) => boolean;
  addFloor: (buildingId: string, name: string) => string;
  deleteFloor: (id: string) => boolean;
  addRoom: (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    sharingType: SharingType,
    capacity: number,
    baseRent: number
  ) => void;
  editRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => boolean;
  updateBedStatus: (bedId: string, status: BedStatus) => void;
  
  generateInvitationLink: () => { token: string; link: string };
  submitApplication: (application: Omit<ResidentApplication, 'id' | 'status' | 'submittedAt'>) => Promise<string>;
  approveApplication: (applicationId: string, allocation: AllocationData) => { residentId: string; resident: Resident };
  rejectApplication: (applicationId: string, reason: string) => void;
  requestCorrection: (applicationId: string, note: string) => void;

  updateResident: (residentId: string, updates: Partial<Resident>) => void;
  changeResidentStatus: (residentId: string, status: ResidentStatus, noticeDate?: string, vacatedDate?: string) => void;

  recordPayment: (payment: PaymentSubmissionData) => PaymentRecord;
  verifyAdminPassword: (password: string) => boolean;

  addRule: (rule: Omit<Rule, 'id' | 'order'>) => void;
  updateRule: (ruleId: string, updates: Partial<Rule>) => void;
  deleteRule: (ruleId: string) => void;
  reorderRules: (rules: Rule[]) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  triggerPaymentReminders: () => number;

  deleteStorageFile: (fileId: string) => void;
  resetToDemoData: () => void;
}

const PGContext = createContext<PGContextType | null>(null);

const STORAGE_KEYS = {
  SETTINGS: 'abcdef_pg_settings',
  BUILDINGS: 'abcdef_pg_buildings',
  FLOORS: 'abcdef_pg_floors',
  ROOMS: 'abcdef_pg_rooms',
  RESIDENTS: 'abcdef_pg_residents',
  APPLICATIONS: 'abcdef_pg_applications',
  PAYMENTS: 'abcdef_pg_payments',
  RULES: 'abcdef_pg_rules',
  NOTIFICATIONS: 'abcdef_pg_notifications',
  STORAGE_FILES: 'abcdef_pg_storage_files',
  AUDIT_LOGS: 'abcdef_pg_audit_logs',
};

export const PGProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [pgSettings, setPgSettings] = useState<PGSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialPGSettings;
  });

  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    return saved ? JSON.parse(saved) : initialBuildings;
  });

  const [floors, setFloors] = useState<Floor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLOORS);
    return saved ? JSON.parse(saved) : initialFloors;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESIDENTS);
    return saved ? JSON.parse(saved) : initialResidents;
  });

  const [applications, setApplications] = useState<ResidentApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return saved ? JSON.parse(saved) : initialApplications;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    return saved ? JSON.parse(saved) : initialRules;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [storageFiles, setStorageFiles] = useState<StorageFile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORAGE_FILES);
    return saved ? JSON.parse(saved) : initialStorageFiles;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  // UI state
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [tenantPortalResidentId, setTenantPortalResidentId] = useState<string | null>(null);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(true);
  const [isPublicPortalMode, setPublicPortalMode] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(pgSettings));
  }, [pgSettings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
  }, [buildings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLOORS, JSON.stringify(floors));
  }, [floors]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(residents));
  }, [residents]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  }, [applications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORAGE_FILES, JSON.stringify(storageFiles));
  }, [storageFiles]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Storage calculations
  const totalStorageBytes = storageFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const totalStorageMb = Number((totalStorageBytes / (1024 * 1024)).toFixed(2));
  const storagePercentage = Number(
    Math.min(100, (totalStorageMb / (pgSettings.storageLimitMb || 500)) * 100).toFixed(1)
  );

  let storageStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'FULL' = 'HEALTHY';
  if (storagePercentage >= 100) storageStatus = 'FULL';
  else if (storagePercentage >= 90) storageStatus = 'CRITICAL';
  else if (storagePercentage >= 80) storageStatus = 'WARNING';

  const isStorageFull = storagePercentage >= 100;

  // Helper for adding audit log
  const logAudit = (action: string, target: string, details?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      actor: 'Admin',
      target,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper for notifications
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Settings
  const updatePGSettings = (updates: Partial<PGSettings>) => {
    setPgSettings((prev) => ({ ...prev, ...updates }));
    logAudit('SETTINGS_UPDATED', 'PG Settings', 'Updated property configuration');
  };

  // Password verification
  const verifyAdminPassword = (password: string): boolean => {
    const valid = password.trim() === (pgSettings.editPassword || '6565');
    if (valid) {
      logAudit('SENSITIVE_EDIT_VERIFIED', 'Security Passcode', 'Admin verified edit authority');
    }
    return valid;
  };

  // Buildings & Floors
  const addBuilding = (name: string, description?: string): string => {
    const id = `bld-${Date.now()}`;
    const newBuilding: Building = { id, name, description };
    setBuildings((prev) => [...prev, newBuilding]);
    // Also create ground floor by default
    const floorId = `flr-${Date.now()}`;
    setFloors((prev) => [...prev, { id: floorId, buildingId: id, name: 'Ground Floor', order: 0 }]);
    logAudit('BUILDING_CREATED', name, `Added new building ${name}`);
    return id;
  };

  const editBuilding = (id: string, name: string, description?: string) => {
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, name, description } : b)));
    logAudit('BUILDING_UPDATED', name, `Updated building details`);
  };

  const deleteBuilding = (id: string): boolean => {
    const hasRooms = rooms.some((r) => r.buildingId === id);
    if (hasRooms) return false;
    setBuildings((prev) => prev.filter((b) => b.id !== id));
    setFloors((prev) => prev.filter((f) => f.buildingId !== id));
    logAudit('BUILDING_DELETED', id, `Deleted building`);
    return true;
  };

  const addFloor = (buildingId: string, name: string): string => {
    const id = `flr-${Date.now()}`;
    const count = floors.filter((f) => f.buildingId === buildingId).length;
    setFloors((prev) => [...prev, { id, buildingId, name, order: count }]);
    logAudit('FLOOR_CREATED', name, `Added floor to building`);
    return id;
  };

  const deleteFloor = (id: string): boolean => {
    const hasRooms = rooms.some((r) => r.floorId === id);
    if (hasRooms) return false;
    setFloors((prev) => prev.filter((f) => f.id !== id));
    logAudit('FLOOR_DELETED', id, `Deleted floor`);
    return true;
  };

  // Rooms & Beds
  const addRoom = (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    sharingType: SharingType,
    capacity: number,
    baseRent: number
  ) => {
    const roomId = `rm-${Date.now()}`;
    const beds = Array.from({ length: capacity }, (_, i) => ({
      id: `bed-${roomId}-${i + 1}`,
      roomId,
      bedNumber: `B${i + 1}`,
      status: 'Available' as BedStatus,
    }));

    const newRoom: Room = {
      id: roomId,
      buildingId,
      floorId,
      roomNumber,
      sharingType,
      capacity,
      baseRent,
      status: 'Active',
      beds,
    };

    setRooms((prev) => [...prev, newRoom]);
    logAudit('ROOM_CREATED', `Room ${roomNumber}`, `Created ${sharingType} with ${capacity} beds`);
  };

  const editRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const updated = { ...r, ...updates };
        // If capacity increased, add beds
        if (updates.capacity && updates.capacity > r.beds.length) {
          const addedBeds = Array.from({ length: updates.capacity - r.beds.length }, (_, i) => ({
            id: `bed-${roomId}-${r.beds.length + i + 1}`,
            roomId,
            bedNumber: `B${r.beds.length + i + 1}`,
            status: 'Available' as BedStatus,
          }));
          updated.beds = [...r.beds, ...addedBeds];
        }
        return updated;
      })
    );
    logAudit('ROOM_UPDATED', `Room ${roomId}`, `Updated room configuration`);
  };

  const deleteRoom = (roomId: string): boolean => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return false;
    const hasOccupants = targetRoom.beds.some((b) => b.status === 'Occupied');
    if (hasOccupants) return false;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    logAudit('ROOM_DELETED', `Room ${targetRoom.roomNumber}`, `Deleted room`);
    return true;
  };

  const updateBedStatus = (bedId: string, status: BedStatus) => {
    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        beds: room.beds.map((b) => {
          if (b.id === bedId) {
            return {
              ...b,
              status,
              ...(status === 'Available' ? { residentId: undefined, residentName: undefined } : {}),
            };
          }
          return b;
        }),
      }))
    );
    logAudit('BED_STATUS_CHANGED', bedId, `Changed bed status to ${status}`);
  };

  // Invitation Link
  const generateInvitationLink = () => {
    const token = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const url = `${window.location.origin}/join/${token}`;
    return { token, link: url };
  };

  // Application Submission
  const submitApplication = async (
    appData: Omit<ResidentApplication, 'id' | 'status' | 'submittedAt'>
  ): Promise<string> => {
    if (isStorageFull) {
      throw new Error('Application storage limit (500 MB) reached. Please contact PG Admin.');
    }

    const nextIdNum = applications.length + residents.length + 8220;
    const appId = `APP-${nextIdNum}`;

    const newApp: ResidentApplication = {
      ...appData,
      id: appId,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    // Track Storage file metadata
    if (appData.photoUrl) {
      const photoFile: StorageFile = {
        id: `fil-${Date.now()}-photo`,
        fileName: `${appData.fullName.toLowerCase().replace(/\s+/g, '_')}_photo.jpg`,
        fileType: 'PROFILE_PHOTO',
        mimeType: 'image/jpeg',
        sizeBytes: appData.photoSizeBytes || 600000,
        sizeMb: Number(((appData.photoSizeBytes || 600000) / (1024 * 1024)).toFixed(2)),
        residentName: `${appData.fullName} (Application)`,
        uploadedAt: new Date().toISOString(),
      };
      setStorageFiles((prev) => [photoFile, ...prev]);
    }

    if (appData.aadharUrl) {
      const aadharFile: StorageFile = {
        id: `fil-${Date.now()}-aadhar`,
        fileName: `${appData.fullName.toLowerCase().replace(/\s+/g, '_')}_aadhaar.jpg`,
        fileType: 'AADHAAR_DOCUMENT',
        mimeType: 'image/jpeg',
        sizeBytes: appData.aadharSizeBytes || 850000,
        sizeMb: Number(((appData.aadharSizeBytes || 850000) / (1024 * 1024)).toFixed(2)),
        residentName: `${appData.fullName} (Application)`,
        uploadedAt: new Date().toISOString(),
      };
      setStorageFiles((prev) => [aadharFile, ...prev]);
    }

    // Admin alert
    addNotification({
      recipientType: 'ADMIN',
      title: 'New Resident Application Received',
      message: `${appData.fullName} has submitted an onboarding application (${appId}) for review.`,
      channel: 'IN_APP',
      type: 'APPLICATION',
      linkUrl: 'applications',
    });

    logAudit('APPLICATION_SUBMITTED', appData.fullName, `Submitted onboarding application ${appId}`);

    return appId;
  };

  // Application Approval & Bed Allocation
  const approveApplication = (
    applicationId: string,
    allocation: AllocationData
  ): { residentId: string; resident: Resident } => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) throw new Error('Application not found');

    const targetRoom = rooms.find((r) => r.id === allocation.roomId);
    if (!targetRoom) throw new Error('Selected room not found');

    const targetBed = targetRoom.beds.find((b) => b.id === allocation.bedId);
    if (!targetBed) throw new Error('Selected bed not found');

    const residentNum = 1040 + residents.length + 1;
    const residentId = `RES-${residentNum}`;

    const newResident: Resident = {
      id: residentId,
      applicationId: app.id,
      fullName: app.fullName,
      mobile: app.mobile,
      email: app.email,
      gender: app.gender,
      permanentAddress: app.permanentAddress,
      occupation: app.occupation,
      emergencyContact: app.emergencyContact,
      photoUrl: app.photoUrl,
      aadharUrl: app.aadharUrl,
      aadharNumberMasked: app.aadharNumberMasked,
      buildingId: allocation.buildingId,
      floorId: allocation.floorId,
      roomId: allocation.roomId,
      bedId: allocation.bedId,
      roomNumber: targetRoom.roomNumber,
      bedNumber: targetBed.bedNumber,
      sharingType: targetRoom.sharingType,
      moveInDate: allocation.moveInDate,
      monthlyRent: allocation.monthlyRent,
      securityDeposit: allocation.securityDeposit,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      notes: allocation.notes,
    };

    // Update bed to occupied
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== allocation.roomId) return r;
        return {
          ...r,
          beds: r.beds.map((b) =>
            b.id === allocation.bedId
              ? { ...b, status: 'Occupied' as BedStatus, residentId, residentName: app.fullName }
              : b
          ),
        };
      })
    );

    // Update application status
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'APPROVED' as const } : a))
    );

    // Add resident
    setResidents((prev) => [newResident, ...prev]);

    // Initial Security Deposit payment record
    if (allocation.securityDeposit > 0) {
      const depositPayment: PaymentRecord = {
        id: `PAY-${Date.now().toString().slice(-4)}`,
        residentId,
        residentName: app.fullName,
        roomNumber: targetRoom.roomNumber,
        bedNumber: targetBed.bedNumber,
        billingMonth: 'Security Deposit',
        totalDueForMonth: allocation.securityDeposit,
        amountPaid: allocation.securityDeposit,
        remainingBalance: 0,
        paymentType: 'Security Deposit',
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        notes: 'Security deposit collected on admission.',
        paidAt: new Date().toISOString(),
        recordedBy: 'Admin',
      };
      setPayments((prev) => [depositPayment, ...prev]);
    }

    // Link storage files to residentId
    setStorageFiles((prev) =>
      prev.map((f) => {
        if (f.residentName?.includes(app.fullName)) {
          return { ...f, residentId, residentName: app.fullName };
        }
        return f;
      })
    );

    // Notifications
    addNotification({
      recipientType: 'ADMIN',
      residentId,
      title: 'Resident Approved & Allocated',
      message: `${app.fullName} assigned to Room ${targetRoom.roomNumber} (${targetBed.bedNumber}) with Resident ID: ${residentId}.`,
      channel: 'IN_APP',
      type: 'APPROVAL',
      linkUrl: 'residents',
    });

    addNotification({
      recipientType: 'TENANT',
      residentId,
      title: `Welcome to ${pgSettings.name}! 🎉`,
      message: `Your application has been approved. Allocated Room ${targetRoom.roomNumber}, Bed ${targetBed.bedNumber}. Your Resident ID is ${residentId}.`,
      channel: 'EMAIL',
      type: 'APPROVAL',
    });

    logAudit(
      'APPLICATION_APPROVED',
      `${app.fullName} (${residentId})`,
      `Approved application and allocated Room ${targetRoom.roomNumber}, Bed ${targetBed.bedNumber}. Monthly Rent: ₹${allocation.monthlyRent}, Deposit: ₹${allocation.securityDeposit}`
    );

    return { residentId, resident: newResident };
  };

  const rejectApplication = (applicationId: string, reason: string) => {
    const app = applications.find((a) => a.id === applicationId);
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: 'REJECTED' as const, rejectionReason: reason } : a))
    );
    if (app) {
      addNotification({
        recipientType: 'TENANT',
        title: 'Application Update',
        message: `Your application for ${pgSettings.name} could not be approved at this time: ${reason}`,
        channel: 'EMAIL',
        type: 'APPLICATION',
      });
      logAudit('APPLICATION_REJECTED', app.fullName, `Reason: ${reason}`);
    }
  };

  const requestCorrection = (applicationId: string, note: string) => {
    const app = applications.find((a) => a.id === applicationId);
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: 'CORRECTION_REQUESTED' as const, correctionNote: note } : a
      )
    );
    if (app) {
      addNotification({
        recipientType: 'TENANT',
        title: 'Application Correction Requested',
        message: `Please update your application details: ${note}`,
        channel: 'EMAIL',
        type: 'APPLICATION',
      });
      logAudit('APPLICATION_CORRECTION_REQUESTED', app.fullName, `Note: ${note}`);
    }
  };

  // Residents
  const updateResident = (residentId: string, updates: Partial<Resident>) => {
    setResidents((prev) => prev.map((r) => (r.id === residentId ? { ...r, ...updates } : r)));
    logAudit('RESIDENT_UPDATED', residentId, `Updated resident profile`);
  };

  const changeResidentStatus = (
    residentId: string,
    status: ResidentStatus,
    noticeDate?: string,
    vacatedDate?: string
  ) => {
    const res = residents.find((r) => r.id === residentId);
    if (!res) return;

    setResidents((prev) =>
      prev.map((r) => {
        if (r.id === residentId) {
          return {
            ...r,
            status,
            ...(noticeDate ? { noticeDate } : {}),
            ...(vacatedDate ? { vacatedDate } : {}),
          };
        }
        return r;
      })
    );

    // If vacated, free the bed
    if (status === 'VACATED') {
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          beds: room.beds.map((b) => {
            if (b.id === res.bedId) {
              return { ...b, status: 'Available' as BedStatus, residentId: undefined, residentName: undefined };
            }
            return b;
          }),
        }))
      );
    }

    logAudit('RESIDENT_STATUS_CHANGED', `${res.fullName} (${residentId})`, `Status changed to ${status}`);
  };

  // Payments (Full, Partial, Custom)
  const recordPayment = (pData: PaymentSubmissionData): PaymentRecord => {
    const res = residents.find((r) => r.id === pData.residentId);
    if (!res) throw new Error('Resident not found');

    const paymentId = `PAY-${Date.now().toString().slice(-4)}`;
    const remaining = Math.max(0, pData.totalDueForMonth - pData.amountPaid);
    const status: PaymentStatus = remaining === 0 ? 'Paid' : 'Partially Paid';

    const newPayment: PaymentRecord = {
      id: paymentId,
      residentId: res.id,
      residentName: res.fullName,
      roomNumber: res.roomNumber,
      bedNumber: res.bedNumber,
      billingMonth: pData.billingMonth,
      totalDueForMonth: pData.totalDueForMonth,
      amountPaid: pData.amountPaid,
      remainingBalance: remaining,
      paymentType: pData.paymentType,
      paymentMethod: pData.paymentMethod,
      status,
      transactionReference: pData.transactionReference,
      notes: pData.notes,
      paidAt: new Date().toISOString(),
      recordedBy: 'Admin',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Admin & Tenant Notifications
    addNotification({
      recipientType: 'ADMIN',
      residentId: res.id,
      title: `Payment Received: ₹${pData.amountPaid.toLocaleString('en-IN')}`,
      message: `Recorded ${status.toLowerCase()} from ${res.fullName} (${res.roomNumber}-${res.bedNumber}). ${
        remaining > 0 ? `Remaining Due: ₹${remaining.toLocaleString('en-IN')}` : 'Full amount cleared.'
      }`,
      channel: 'IN_APP',
      type: 'PAYMENT_RECORDED',
      linkUrl: 'payments',
    });

    addNotification({
      recipientType: 'TENANT',
      residentId: res.id,
      title: `Payment Receipt: ₹${pData.amountPaid.toLocaleString('en-IN')}`,
      message: `Payment of ₹${pData.amountPaid.toLocaleString('en-IN')} for ${
        pData.billingMonth
      } received via ${pData.paymentMethod}. ${
        remaining > 0 ? `Remaining Due: ₹${remaining.toLocaleString('en-IN')}` : 'Balance: ₹0 (Paid in full).'
      }`,
      channel: 'EMAIL',
      type: 'PAYMENT_RECORDED',
    });

    logAudit(
      'PAYMENT_RECORDED',
      `${res.fullName} (${res.id})`,
      `Recorded ₹${pData.amountPaid} for ${pData.billingMonth} via ${pData.paymentMethod}. Remaining balance: ₹${remaining}`
    );

    return newPayment;
  };

  // Rules
  const addRule = (ruleData: Omit<Rule, 'id' | 'order'>) => {
    const newRule: Rule = {
      ...ruleData,
      id: `rul-${Date.now()}`,
      order: rules.length + 1,
    };
    setRules((prev) => [...prev, newRule]);
    logAudit('RULE_ADDED', ruleData.title, 'Created new PG rule');
  };

  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
    logAudit('RULE_UPDATED', ruleId, 'Updated PG rule');
  };

  const deleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    logAudit('RULE_DELETED', ruleId, 'Removed PG rule');
  };

  const reorderRules = (newRules: Rule[]) => {
    setRules(newRules);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Payment Reminder Trigger (Simulates automated reminder engine)
  const triggerPaymentReminders = (): number => {
    const currentMonth = 'August 2026';
    let remindersSent = 0;

    residents
      .filter((r) => r.status === 'ACTIVE')
      .forEach((res) => {
        // Check current month payments
        const monthlyPayments = payments.filter(
          (p) => p.residentId === res.id && p.billingMonth === currentMonth && p.paymentType === 'Rent'
        );
        const totalPaid = monthlyPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const dueAmount = Math.max(0, res.monthlyRent - totalPaid);

        if (dueAmount > 0) {
          remindersSent++;
          // Admin alert
          addNotification({
            recipientType: 'ADMIN',
            residentId: res.id,
            title: `Payment Reminder: ${res.fullName}`,
            message: `${res.fullName} (Room ${res.roomNumber}, Bed ${res.bedNumber}) has ₹${dueAmount.toLocaleString(
              'en-IN'
            )} pending for ${currentMonth}.`,
            channel: 'PUSH',
            type: 'PAYMENT_DUE',
            linkUrl: 'payments',
          });

          // Tenant alert
          addNotification({
            recipientType: 'TENANT',
            residentId: res.id,
            title: `Monthly Fee Reminder — ${pgSettings.name}`,
            message: `Hi ${res.fullName}, your monthly fee of ₹${dueAmount.toLocaleString(
              'en-IN'
            )} for ${currentMonth} is due. Please clear via UPI or contact the warden.`,
            channel: 'EMAIL',
            type: 'PAYMENT_DUE',
          });
        }
      });

    logAudit('REMINDER_DISPATCHED', 'System Notification Engine', `Sent payment reminders to ${remindersSent} residents`);
    return remindersSent;
  };

  // File Deletion / Cleanup
  const deleteStorageFile = (fileId: string) => {
    const file = storageFiles.find((f) => f.id === fileId);
    setStorageFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (file) {
      logAudit('FILE_DELETED', file.fileName, `Freed ${file.sizeMb} MB of application storage`);
    }
  };

  const resetToDemoData = () => {
    setPgSettings(initialPGSettings);
    setBuildings(initialBuildings);
    setFloors(initialFloors);
    setRooms(initialRooms);
    setResidents(initialResidents);
    setApplications(initialApplications);
    setPayments(initialPayments);
    setRules(initialRules);
    setStorageFiles(initialStorageFiles);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    localStorage.clear();
    logAudit('SYSTEM_RESET', 'Database', 'Reset all records to factory demo state');
  };

  return (
    <PGContext.Provider
      value={{
        pgSettings,
        buildings,
        floors,
        rooms,
        residents,
        applications,
        payments,
        rules,
        notifications,
        storageFiles,
        auditLogs,
        activeView,
        selectedResidentId,
        selectedApplicationId,
        tenantPortalResidentId,
        onboardingToken,
        isAdminLoggedIn,
        isPublicPortalMode,
        totalStorageBytes,
        totalStorageMb,
        storagePercentage,
        storageStatus,
        isStorageFull,
        setActiveView,
        setSelectedResidentId,
        setSelectedApplicationId,
        setTenantPortalResidentId,
        setOnboardingToken,
        setIsAdminLoggedIn,
        setPublicPortalMode,
        updatePGSettings,
        addBuilding,
        editBuilding,
        deleteBuilding,
        addFloor,
        deleteFloor,
        addRoom,
        editRoom,
        deleteRoom,
        updateBedStatus,
        generateInvitationLink,
        submitApplication,
        approveApplication,
        rejectApplication,
        requestCorrection,
        updateResident,
        changeResidentStatus,
        recordPayment,
        verifyAdminPassword,
        addRule,
        updateRule,
        deleteRule,
        reorderRules,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        triggerPaymentReminders,
        deleteStorageFile,
        resetToDemoData,
      }}
    >
      {children}
    </PGContext.Provider>
  );
};

export const usePG = (): PGContextType => {
  const context = useContext(PGContext);
  if (!context) throw new Error('usePG must be used within a PGProvider');
  return context;
};
