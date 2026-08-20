import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectToDatabase, isDbConnected } from './server/db.js';
import {
  SettingModel,
  BuildingModel,
  FloorModel,
  RoomModel,
  ResidentModel,
  ApplicationModel,
  PaymentModel,
  RuleModel,
  NotificationModel,
  StorageFileModel,
  AuditLogModel,
  InvitationModel,
} from './server/models.js';

const app = express();
const PORT = 3000;

// Body parsers with large limit for image data URLs
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initial MongoDB connection
connectToDatabase();

// ==========================================
// 1. Health & Diagnostics
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'connecting_or_disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. Full Bootstrap Data (Fast Hydration)
// ==========================================
app.get('/api/bootstrap', async (req, res) => {
  try {
    await connectToDatabase();

    const [
      settings,
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
    ] = await Promise.all([
      SettingModel.findOne().lean(),
      BuildingModel.find().lean(),
      FloorModel.find().sort({ order: 1 }).lean(),
      RoomModel.find().lean(),
      ResidentModel.find().sort({ createdAt: -1 }).lean(),
      ApplicationModel.find().sort({ submittedAt: -1 }).lean(),
      PaymentModel.find().sort({ paidAt: -1 }).lean(),
      RuleModel.find().sort({ order: 1 }).lean(),
      NotificationModel.find().sort({ timestamp: -1 }).lean(),
      StorageFileModel.find().sort({ uploadedAt: -1 }).lean(),
      AuditLogModel.find().sort({ timestamp: -1 }).limit(100).lean(),
    ]);

    res.json({
      success: true,
      data: {
        pgSettings: settings || {
          name: 'ABC DEF PG',
          type: 'Gents',
          address: '#42, 4th Cross, 7th Main, Koramangala 4th Block, Bengaluru, Karnataka - 560034',
          contactNumber: '+91 98765 43210',
          email: 'srisaigentspg78@gmail.com',
          description: 'Premium, secure & fully furnished PG accommodation.',
          monthlyDueDay: 5,
          storageLimitMb: 500,
          editPassword: '6565',
          reminderSchedule: {
            firstReminderDaysBefore: 2,
            secondReminderDaysBefore: 1,
            dueDateReminder: true,
            overdueReminderDaysAfter: 1,
            repeatOverdueDays: 3,
            maxReminders: 5,
          },
        },
        buildings: buildings || [],
        floors: floors || [],
        rooms: rooms || [],
        residents: residents || [],
        applications: applications || [],
        payments: payments || [],
        rules: rules || [],
        notifications: notifications || [],
        storageFiles: storageFiles || [],
        auditLogs: auditLogs || [],
      },
    });
  } catch (error: any) {
    console.error('[API /api/bootstrap] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. Settings Endpoints
// ==========================================
app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    let setting = await SettingModel.findOne();
    if (setting) {
      Object.assign(setting, updates);
      await setting.save();
    } else {
      setting = await SettingModel.create(updates);
    }

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'SETTINGS_UPDATED',
      actor: 'Admin',
      target: 'PG Profile & Configuration',
      details: 'Updated PG settings in MongoDB',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, setting });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. Buildings & Floors Endpoints
// ==========================================
app.post('/api/buildings', async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = `bld-${Date.now()}`;
    const building = await BuildingModel.create({ id, name, description });

    // Auto-create Ground Floor
    const floorId = `flr-${Date.now()}`;
    const floor = await FloorModel.create({ id: floorId, buildingId: id, name: 'Ground Floor', order: 0 });

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'BUILDING_CREATED',
      actor: 'Admin',
      target: name,
      details: `Added new building ${name} with Ground Floor`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, building, floor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/buildings/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const building = await BuildingModel.findOneAndUpdate(
      { id: req.params.id },
      { name, description },
      { new: true }
    );
    res.json({ success: true, building });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/buildings/:id', async (req, res) => {
  try {
    const hasRooms = await RoomModel.exists({ buildingId: req.params.id });
    if (hasRooms) {
      return res.status(400).json({ success: false, error: 'Cannot delete building that has rooms.' });
    }
    await BuildingModel.deleteOne({ id: req.params.id });
    await FloorModel.deleteMany({ buildingId: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/floors', async (req, res) => {
  try {
    const { buildingId, name } = req.body;
    const id = `flr-${Date.now()}`;
    const count = await FloorModel.countDocuments({ buildingId });
    const floor = await FloorModel.create({ id, buildingId, name, order: count });
    res.json({ success: true, floor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/floors/:id', async (req, res) => {
  try {
    const hasRooms = await RoomModel.exists({ floorId: req.params.id });
    if (hasRooms) {
      return res.status(400).json({ success: false, error: 'Cannot delete floor that has rooms.' });
    }
    await FloorModel.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. Rooms & Beds Endpoints
// ==========================================
app.post('/api/rooms', async (req, res) => {
  try {
    const { buildingId, floorId, roomNumber, sharingType, capacity, baseRent } = req.body;
    const roomId = `rm-${Date.now()}`;

    const beds = Array.from({ length: capacity }, (_, i) => ({
      id: `bed-${roomId}-${i + 1}`,
      roomId,
      bedNumber: `B${i + 1}`,
      status: 'Available' as const,
    }));

    const room = await RoomModel.create({
      id: roomId,
      buildingId,
      floorId,
      roomNumber,
      sharingType,
      capacity,
      baseRent,
      status: 'Active',
      beds,
    });

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'ROOM_CREATED',
      actor: 'Admin',
      target: `Room ${roomNumber}`,
      details: `Created ${sharingType} with ${capacity} beds at ₹${baseRent}/mo`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, room });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const updates = req.body;
    const room = await RoomModel.findOneAndUpdate({ id: req.params.id }, updates, { new: true });
    res.json({ success: true, room });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const room = await RoomModel.findOne({ id: req.params.id });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    const hasOccupants = room.beds?.some((b: any) => b.status === 'Occupied');
    if (hasOccupants) {
      return res.status(400).json({ success: false, error: 'Cannot delete room with active occupants.' });
    }

    await RoomModel.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/beds/:bedId/status', async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status } = req.body;

    const room = await RoomModel.findOne({ 'beds.id': bedId });
    if (!room) return res.status(404).json({ success: false, error: 'Bed not found' });

    const bed = room.beds.find((b: any) => b.id === bedId);
    if (bed) {
      bed.status = status;
      if (status === 'Available') {
        bed.residentId = undefined;
        bed.residentName = undefined;
      }
      await room.save();
    }

    res.json({ success: true, room });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. Tenant Invitation Links (INVITE TENANT)
// ==========================================
app.post('/api/invitations', async (req, res) => {
  try {
    const token = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const settings = await SettingModel.findOne().lean();
    const pgName = settings?.name || 'ABC DEF PG';

    const invitation = await InvitationModel.create({
      token,
      pgName,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days valid
      used: false,
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const link = `${protocol}://${host}/join/${token}`;

    res.json({
      success: true,
      token,
      link,
      invitation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await InvitationModel.findOne({ token }).lean();
    const settings = await SettingModel.findOne().lean();

    res.json({
      success: true,
      valid: !!invitation,
      invitation,
      pgSettings: settings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. Applications Endpoints (Onboarding)
// ==========================================
app.post('/api/applications', async (req, res) => {
  try {
    const appData = req.body;
    const count = (await ApplicationModel.countDocuments()) + (await ResidentModel.countDocuments());
    const appId = `APP-${8220 + count}`;

    const newApp = await ApplicationModel.create({
      ...appData,
      id: appId,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    });

    // Save storage metadata if photo/Aadhaar attached
    if (appData.photoUrl) {
      await StorageFileModel.create({
        id: `fil-${Date.now()}-photo`,
        fileName: `${appData.fullName.toLowerCase().replace(/\s+/g, '_')}_photo.jpg`,
        fileType: 'PROFILE_PHOTO',
        mimeType: 'image/jpeg',
        sizeBytes: appData.photoSizeBytes || 200000,
        sizeMb: Number(((appData.photoSizeBytes || 200000) / (1024 * 1024)).toFixed(2)),
        residentName: `${appData.fullName} (Application)`,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (appData.aadharUrl) {
      await StorageFileModel.create({
        id: `fil-${Date.now()}-aadhar`,
        fileName: `${appData.fullName.toLowerCase().replace(/\s+/g, '_')}_aadhaar.jpg`,
        fileType: 'AADHAAR_DOCUMENT',
        mimeType: 'image/jpeg',
        sizeBytes: appData.aadharSizeBytes || 350000,
        sizeMb: Number(((appData.aadharSizeBytes || 350000) / (1024 * 1024)).toFixed(2)),
        residentName: `${appData.fullName} (Application)`,
        uploadedAt: new Date().toISOString(),
      });
    }

    // Mark invite token as used if present
    if (appData.invitationToken) {
      await InvitationModel.findOneAndUpdate(
        { token: appData.invitationToken },
        { used: true, usedByApplicationId: appId }
      );
    }

    // Admin Notification
    await NotificationModel.create({
      id: `notif-${Date.now()}`,
      recipientType: 'ADMIN',
      title: 'New Resident Application Received',
      message: `${appData.fullName} has submitted an onboarding application (${appId}) for review.`,
      channel: 'IN_APP',
      type: 'APPLICATION',
      linkUrl: 'applications',
      timestamp: new Date().toISOString(),
      read: false,
    });

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'APPLICATION_SUBMITTED',
      actor: appData.fullName,
      target: appId,
      details: `Submitted onboarding application from public portal`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, appId, application: newApp });
  } catch (error: any) {
    console.error('[API /api/applications] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = req.body; // { buildingId, floorId, roomId, bedId, monthlyRent, securityDeposit, moveInDate, notes }

    const appDoc = await ApplicationModel.findOne({ id });
    if (!appDoc) return res.status(404).json({ success: false, error: 'Application not found' });

    const room = await RoomModel.findOne({ id: allocation.roomId });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    const bed = room.beds.find((b: any) => b.id === allocation.bedId);
    if (!bed) return res.status(404).json({ success: false, error: 'Bed not found' });

    const residentCount = await ResidentModel.countDocuments();
    const residentId = `RES-${1040 + residentCount + 1}`;

    // 1. Create Resident
    const resident = await ResidentModel.create({
      id: residentId,
      applicationId: appDoc.id,
      fullName: appDoc.fullName,
      mobile: appDoc.mobile,
      email: appDoc.email,
      gender: appDoc.gender,
      permanentAddress: appDoc.permanentAddress,
      occupation: appDoc.occupation,
      emergencyContact: appDoc.emergencyContact,
      photoUrl: appDoc.photoUrl,
      aadharUrl: appDoc.aadharUrl,
      aadharNumberMasked: appDoc.aadharNumberMasked,
      buildingId: allocation.buildingId,
      floorId: allocation.floorId,
      roomId: allocation.roomId,
      bedId: allocation.bedId,
      roomNumber: room.roomNumber,
      bedNumber: bed.bedNumber,
      sharingType: room.sharingType,
      moveInDate: allocation.moveInDate,
      monthlyRent: allocation.monthlyRent,
      securityDeposit: allocation.securityDeposit || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      notes: allocation.notes || '',
    });

    // 2. Mark Bed Occupied
    bed.status = 'Occupied';
    bed.residentId = residentId;
    bed.residentName = appDoc.fullName;
    await room.save();

    // 3. Mark Application Approved
    appDoc.status = 'APPROVED';
    await appDoc.save();

    // 4. Initial Security Deposit record
    if (allocation.securityDeposit > 0) {
      await PaymentModel.create({
        id: `PAY-${Date.now().toString().slice(-4)}`,
        residentId,
        residentName: appDoc.fullName,
        roomNumber: room.roomNumber,
        bedNumber: bed.bedNumber,
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
      });
    }

    // 5. Notifications
    await NotificationModel.create({
      id: `notif-${Date.now()}`,
      recipientType: 'ADMIN',
      residentId,
      title: 'Resident Approved & Bed Allocated',
      message: `${appDoc.fullName} assigned to Room ${room.roomNumber} (${bed.bedNumber}) with Resident ID: ${residentId}.`,
      channel: 'IN_APP',
      type: 'APPROVAL',
      linkUrl: 'residents',
      timestamp: new Date().toISOString(),
      read: false,
    });

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'APPLICATION_APPROVED',
      actor: 'Admin',
      target: `${appDoc.fullName} (${residentId})`,
      details: `Approved application and allocated Room ${room.roomNumber}, Bed ${bed.bedNumber}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, residentId, resident });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appDoc = await ApplicationModel.findOneAndUpdate(
      { id },
      { status: 'REJECTED', rejectionReason: reason },
      { new: true }
    );

    res.json({ success: true, application: appDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/applications/:id/request-correction', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const appDoc = await ApplicationModel.findOneAndUpdate(
      { id },
      { status: 'CORRECTION_REQUESTED', correctionNote: note },
      { new: true }
    );

    res.json({ success: true, application: appDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. Residents Endpoints
// ==========================================
app.put('/api/residents/:id', async (req, res) => {
  try {
    const updates = req.body;
    const resident = await ResidentModel.findOneAndUpdate({ id: req.params.id }, updates, { new: true });
    res.json({ success: true, resident });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/residents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, noticeDate, vacatedDate } = req.body;

    const resident = await ResidentModel.findOne({ id });
    if (!resident) return res.status(404).json({ success: false, error: 'Resident not found' });

    resident.status = status;
    if (noticeDate) resident.noticeDate = noticeDate;
    if (vacatedDate) resident.vacatedDate = vacatedDate;
    await resident.save();

    // If vacated, free the bed
    if (status === 'VACATED') {
      const room = await RoomModel.findOne({ id: resident.roomId });
      if (room) {
        const bed = room.beds.find((b: any) => b.id === resident.bedId);
        if (bed) {
          bed.status = 'Available';
          bed.residentId = undefined;
          bed.residentName = undefined;
          await room.save();
        }
      }
    }

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'RESIDENT_STATUS_CHANGED',
      actor: 'Admin',
      target: `${resident.fullName} (${id})`,
      details: `Status updated to ${status}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, resident });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 9. Payments Endpoints
// ==========================================
app.post('/api/payments', async (req, res) => {
  try {
    const pData = req.body;
    const resident = await ResidentModel.findOne({ id: pData.residentId });
    if (!resident) return res.status(404).json({ success: false, error: 'Resident not found' });

    const paymentId = `PAY-${Date.now().toString().slice(-4)}`;
    const remaining = Math.max(0, pData.totalDueForMonth - pData.amountPaid);
    const status = remaining === 0 ? 'Paid' : 'Partially Paid';

    const payment = await PaymentModel.create({
      id: paymentId,
      residentId: resident.id,
      residentName: resident.fullName,
      roomNumber: resident.roomNumber,
      bedNumber: resident.bedNumber,
      billingMonth: pData.billingMonth,
      totalDueForMonth: pData.totalDueForMonth,
      amountPaid: pData.amountPaid,
      remainingBalance: remaining,
      paymentType: pData.paymentType || 'Rent',
      paymentMethod: pData.paymentMethod || 'UPI',
      status,
      transactionReference: pData.transactionReference,
      notes: pData.notes,
      paidAt: new Date().toISOString(),
      recordedBy: 'Admin',
    });

    // Admin Notification
    await NotificationModel.create({
      id: `notif-${Date.now()}`,
      recipientType: 'ADMIN',
      residentId: resident.id,
      title: `Payment Received: ₹${pData.amountPaid.toLocaleString('en-IN')}`,
      message: `Recorded ${status.toLowerCase()} from ${resident.fullName} (${resident.roomNumber}-${resident.bedNumber}). ${
        remaining > 0 ? `Remaining Due: ₹${remaining.toLocaleString('en-IN')}` : 'Full amount cleared.'
      }`,
      channel: 'IN_APP',
      type: 'PAYMENT_RECORDED',
      linkUrl: 'payments',
      timestamp: new Date().toISOString(),
      read: false,
    });

    await AuditLogModel.create({
      id: `aud-${Date.now()}`,
      action: 'PAYMENT_RECORDED',
      actor: 'Admin',
      target: `${resident.fullName} (${paymentId})`,
      details: `Collected ₹${pData.amountPaid} for ${pData.billingMonth} via ${pData.paymentMethod}. Remaining: ₹${remaining}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 10. Rules Endpoints
// ==========================================
app.post('/api/rules', async (req, res) => {
  try {
    const { title, description, category, isMandatory } = req.body;
    const id = `rul-${Date.now()}`;
    const order = (await RuleModel.countDocuments()) + 1;
    const rule = await RuleModel.create({ id, title, description, category, order, isMandatory });
    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/rules/:id', async (req, res) => {
  try {
    const rule = await RuleModel.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, rule });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/rules/:id', async (req, res) => {
  try {
    await RuleModel.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 11. Storage & Notifications Endpoints
// ==========================================
app.delete('/api/storage/:id', async (req, res) => {
  try {
    await StorageFileModel.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await NotificationModel.updateOne({ id: req.params.id }, { read: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    await NotificationModel.updateMany({}, { read: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// Vite Middleware / Production Static Serve
// ==========================================
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express] Server running on http://0.0.0.0:${PORT}`);
  });
}

startApp();
