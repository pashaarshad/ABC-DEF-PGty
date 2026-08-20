import {
  PGSettings,
  Building,
  Floor,
  Room,
  Resident,
  ResidentApplication,
  PaymentRecord,
  Rule,
  NotificationItem,
  StorageFile,
  AuditLog,
  BedStatus,
  ResidentStatus,
  SharingType,
  PaymentType,
  PaymentMethod,
} from '../types';

export interface BootstrapResponse {
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
}

export const api = {
  // Bootstrap all data from MongoDB
  async getBootstrapData(): Promise<BootstrapResponse | null> {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (err) {
      console.warn('[API Client] Bootstrap fetch failed, using local/cached state:', err);
      return null;
    }
  },

  // Settings
  async updateSettings(settings: Partial<PGSettings>): Promise<PGSettings | null> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      return json.success ? json.setting : null;
    } catch (err) {
      console.error('[API Client] Update settings error:', err);
      return null;
    }
  },

  // Buildings & Floors
  async addBuilding(name: string, description?: string): Promise<{ building: Building; floor: Floor } | null> {
    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      return json.success ? { building: json.building, floor: json.floor } : null;
    } catch (err) {
      console.error('[API Client] Add building error:', err);
      return null;
    }
  },

  async updateBuilding(id: string, name: string, description?: string): Promise<Building | null> {
    try {
      const res = await fetch(`/api/buildings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      return json.success ? json.building : null;
    } catch (err) {
      console.error('[API Client] Update building error:', err);
      return null;
    }
  },

  async deleteBuilding(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Delete building error:', err);
      return false;
    }
  },

  async addFloor(buildingId: string, name: string): Promise<Floor | null> {
    try {
      const res = await fetch('/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId, name }),
      });
      const json = await res.json();
      return json.success ? json.floor : null;
    } catch (err) {
      console.error('[API Client] Add floor error:', err);
      return null;
    }
  },

  async deleteFloor(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/floors/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Delete floor error:', err);
      return false;
    }
  },

  // Rooms & Beds
  async addRoom(
    buildingId: string,
    floorId: string,
    roomNumber: string,
    sharingType: SharingType,
    capacity: number,
    baseRent: number
  ): Promise<Room | null> {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId, floorId, roomNumber, sharingType, capacity, baseRent }),
      });
      const json = await res.json();
      return json.success ? json.room : null;
    } catch (err) {
      console.error('[API Client] Add room error:', err);
      return null;
    }
  },

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | null> {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json.success ? json.room : null;
    } catch (err) {
      console.error('[API Client] Update room error:', err);
      return null;
    }
  },

  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Delete room error:', err);
      return false;
    }
  },

  async updateBedStatus(bedId: string, status: BedStatus): Promise<boolean> {
    try {
      const res = await fetch(`/api/beds/${bedId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Update bed status error:', err);
      return false;
    }
  },

  // Invitations (INVITE TENANT)
  async generateInvitation(): Promise<{ token: string; link: string } | null> {
    try {
      const res = await fetch('/api/invitations', { method: 'POST' });
      const json = await res.json();
      return json.success ? { token: json.token, link: json.link } : null;
    } catch (err) {
      console.error('[API Client] Generate invitation error:', err);
      return null;
    }
  },

  async verifyInvitation(token: string): Promise<any> {
    try {
      const res = await fetch(`/api/invitations/${token}`);
      const json = await res.json();
      return json;
    } catch (err) {
      console.error('[API Client] Verify invitation error:', err);
      return null;
    }
  },

  // Applications
  async submitApplication(
    application: Omit<ResidentApplication, 'id' | 'status' | 'submittedAt'>
  ): Promise<{ appId: string; application: ResidentApplication } | null> {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      });
      const json = await res.json();
      return json.success ? { appId: json.appId, application: json.application } : null;
    } catch (err) {
      console.error('[API Client] Submit application error:', err);
      return null;
    }
  },

  async approveApplication(
    applicationId: string,
    allocation: {
      buildingId: string;
      floorId: string;
      roomId: string;
      bedId: string;
      monthlyRent: number;
      securityDeposit: number;
      moveInDate: string;
      notes?: string;
    }
  ): Promise<{ residentId: string; resident: Resident } | null> {
    try {
      const res = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation),
      });
      const json = await res.json();
      return json.success ? { residentId: json.residentId, resident: json.resident } : null;
    } catch (err) {
      console.error('[API Client] Approve application error:', err);
      return null;
    }
  },

  async rejectApplication(applicationId: string, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Reject application error:', err);
      return false;
    }
  },

  async requestCorrection(applicationId: string, note: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/applications/${applicationId}/request-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Request correction error:', err);
      return false;
    }
  },

  // Residents
  async updateResident(residentId: string, updates: Partial<Resident>): Promise<Resident | null> {
    try {
      const res = await fetch(`/api/residents/${residentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json.success ? json.resident : null;
    } catch (err) {
      console.error('[API Client] Update resident error:', err);
      return null;
    }
  },

  async updateResidentStatus(
    residentId: string,
    status: ResidentStatus,
    noticeDate?: string,
    vacatedDate?: string
  ): Promise<Resident | null> {
    try {
      const res = await fetch(`/api/residents/${residentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, noticeDate, vacatedDate }),
      });
      const json = await res.json();
      return json.success ? json.resident : null;
    } catch (err) {
      console.error('[API Client] Update resident status error:', err);
      return null;
    }
  },

  // Payments
  async recordPayment(payment: {
    residentId: string;
    billingMonth: string;
    totalDueForMonth: number;
    amountPaid: number;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    notes?: string;
  }): Promise<PaymentRecord | null> {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      const json = await res.json();
      return json.success ? json.payment : null;
    } catch (err) {
      console.error('[API Client] Record payment error:', err);
      return null;
    }
  },

  // Rules
  async addRule(rule: Omit<Rule, 'id' | 'order'>): Promise<Rule | null> {
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const json = await res.json();
      return json.success ? json.rule : null;
    } catch (err) {
      console.error('[API Client] Add rule error:', err);
      return null;
    }
  },

  async updateRule(id: string, updates: Partial<Rule>): Promise<Rule | null> {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json.success ? json.rule : null;
    } catch (err) {
      console.error('[API Client] Update rule error:', err);
      return null;
    }
  },

  async deleteRule(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Delete rule error:', err);
      return false;
    }
  },

  // Storage
  async deleteStorageFile(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/storage/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Delete storage file error:', err);
      return false;
    }
  },

  // Notifications
  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Mark notification read error:', err);
      return false;
    }
  },

  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.error('[API Client] Mark all read error:', err);
      return false;
    }
  },
};
