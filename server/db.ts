import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  SettingModel,
  BuildingModel,
  FloorModel,
  RoomModel,
  ResidentModel,
  ApplicationModel,
  PaymentModel,
  RuleModel,
  StorageFileModel,
  NotificationModel,
  AuditLogModel,
  InvitationModel,
} from './models.js';

dotenv.config();

const DEFAULT_MONGODB_URI =
  'mongodb+srv://srisaigentspg78_db_user:bn1rf9dpQB08dmP7@cluster0.eeiglqt.mongodb.net/pg_management?appName=Cluster0';

export const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Cluster...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    console.log('[MongoDB] Successfully connected to MongoDB database!');

    // Initialize/seed collections if empty
    await seedDatabaseIfEmpty();
    return true;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Initial seed data if database is fresh
async function seedDatabaseIfEmpty() {
  try {
    const buildingCount = await BuildingModel.countDocuments();
    if (buildingCount === 0) {
      console.log('[MongoDB] Fresh database detected. Seeding initial PG data...');

      // 1. Settings
      await SettingModel.create({
        name: 'ABC DEF Luxury PG & Hostel',
        type: 'Gents',
        address: '#42, 4th Cross, 7th Main, Koramangala 4th Block, Bengaluru, Karnataka - 560034',
        contactNumber: '+91 98765 43210',
        email: 'srisaigentspg78@gmail.com',
        description: 'Premium, secure & fully furnished PG accommodation with high-speed Wi-Fi, 3-time hygienic food, daily housekeeping and 24/7 security.',
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
      });

      // 2. Buildings
      await BuildingModel.create([
        { id: 'bld-1', name: 'Building A (Main Wing)', description: '4 Floors, Premium rooms with attached balcony' },
        { id: 'bld-2', name: 'Building B (North Wing)', description: '3 Floors, Standard executive rooms' },
      ]);

      // 3. Floors
      await FloorModel.create([
        { id: 'flr-g', buildingId: 'bld-1', name: 'Ground Floor', order: 0 },
        { id: 'flr-1', buildingId: 'bld-1', name: 'Floor 1', order: 1 },
        { id: 'flr-2', buildingId: 'bld-1', name: 'Floor 2', order: 2 },
        { id: 'flr-b-1', buildingId: 'bld-2', name: 'Floor 1', order: 1 },
        { id: 'flr-b-2', buildingId: 'bld-2', name: 'Floor 2', order: 2 },
      ]);

      // 4. Rooms
      await RoomModel.create([
        {
          id: 'rm-101',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomNumber: '101',
          sharingType: '2-Sharing',
          capacity: 2,
          baseRent: 9500,
          status: 'Active',
          beds: [
            { id: 'bed-101-1', roomId: 'rm-101', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1001', residentName: 'Rohan Gupta' },
            { id: 'bed-101-2', roomId: 'rm-101', bedNumber: 'B2', status: 'Available' },
          ],
        },
        {
          id: 'rm-102',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomNumber: '102',
          sharingType: '3-Sharing',
          capacity: 3,
          baseRent: 7500,
          status: 'Active',
          beds: [
            { id: 'bed-102-1', roomId: 'rm-102', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1002', residentName: 'Siddharth Nair' },
            { id: 'bed-102-2', roomId: 'rm-102', bedNumber: 'B2', status: 'Occupied', residentId: 'RES-1003', residentName: 'Aman Sharma' },
            { id: 'bed-102-3', roomId: 'rm-102', bedNumber: 'B3', status: 'Available' },
          ],
        },
        {
          id: 'rm-103',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomNumber: '103',
          sharingType: 'Single',
          capacity: 1,
          baseRent: 14000,
          status: 'Active',
          beds: [
            { id: 'bed-103-1', roomId: 'rm-103', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1004', residentName: 'Vikram Mehta' },
          ],
        },
        {
          id: 'rm-201',
          buildingId: 'bld-1',
          floorId: 'flr-2',
          roomNumber: '201',
          sharingType: '2-Sharing',
          capacity: 2,
          baseRent: 9500,
          status: 'Active',
          beds: [
            { id: 'bed-201-1', roomId: 'rm-201', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1005', residentName: 'Rahul Verma' },
            { id: 'bed-201-2', roomId: 'rm-201', bedNumber: 'B2', status: 'Available' },
          ],
        },
        {
          id: 'rm-202',
          buildingId: 'bld-1',
          floorId: 'flr-2',
          roomNumber: '202',
          sharingType: '4-Sharing',
          capacity: 4,
          baseRent: 6500,
          status: 'Active',
          beds: [
            { id: 'bed-202-1', roomId: 'rm-202', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1006', residentName: 'Karthik Rao' },
            { id: 'bed-202-2', roomId: 'rm-202', bedNumber: 'B2', status: 'Occupied', residentId: 'RES-1007', residentName: 'Sameer Joshi' },
            { id: 'bed-202-3', roomId: 'rm-202', bedNumber: 'B3', status: 'Available' },
            { id: 'bed-202-4', roomId: 'rm-202', bedNumber: 'B4', status: 'Maintenance' },
          ],
        },
        {
          id: 'rm-b-101',
          buildingId: 'bld-2',
          floorId: 'flr-b-1',
          roomNumber: 'B-101',
          sharingType: '2-Sharing',
          capacity: 2,
          baseRent: 9000,
          status: 'Active',
          beds: [
            { id: 'bed-b101-1', roomId: 'rm-b-101', bedNumber: 'B1', status: 'Occupied', residentId: 'RES-1008', residentName: 'Arjun Das' },
            { id: 'bed-b101-2', roomId: 'rm-b-101', bedNumber: 'B2', status: 'Available' },
          ],
        },
      ]);

      // 5. Residents
      await ResidentModel.create([
        {
          id: 'RES-1001',
          applicationId: 'APP-8201',
          fullName: 'Rohan Gupta',
          mobile: '9876501001',
          email: 'rohan.gupta@gmail.com',
          gender: 'Male',
          permanentAddress: '14/B, Civil Lines, Jaipur, Rajasthan',
          occupation: 'Software Engineer at Infosys',
          emergencyContact: { relationship: 'Father', name: 'Rajesh Gupta', phone: '9829011223' },
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-3829',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomId: 'rm-101',
          bedId: 'bed-101-1',
          roomNumber: '101',
          bedNumber: 'B1',
          sharingType: '2-Sharing',
          moveInDate: '2026-03-01',
          monthlyRent: 9500,
          securityDeposit: 15000,
          status: 'ACTIVE',
          createdAt: '2026-03-01T10:00:00.000Z',
          notes: 'Vegetarian meals preferred.',
        },
        {
          id: 'RES-1002',
          applicationId: 'APP-8202',
          fullName: 'Siddharth Nair',
          mobile: '9876501002',
          email: 'siddharth.nair@gmail.com',
          gender: 'Male',
          permanentAddress: 'Flat 302, Palm Heights, Kochi, Kerala',
          occupation: 'Product Designer at Swiggy',
          emergencyContact: { relationship: 'Mother', name: 'Lakshmi Nair', phone: '9447012345' },
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-9142',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomId: 'rm-102',
          bedId: 'bed-102-1',
          roomNumber: '102',
          bedNumber: 'B1',
          sharingType: '3-Sharing',
          moveInDate: '2026-04-15',
          monthlyRent: 7500,
          securityDeposit: 12000,
          status: 'ACTIVE',
          createdAt: '2026-04-15T11:30:00.000Z',
          notes: 'Two-wheeler parking spot allocated (Slot P-04).',
        },
        {
          id: 'RES-1003',
          applicationId: 'APP-8203',
          fullName: 'Aman Sharma',
          mobile: '9876501003',
          email: 'aman.sharma@gmail.com',
          gender: 'Male',
          permanentAddress: 'H.No 88, Model Town, Delhi',
          occupation: 'Financial Analyst at Deloitte',
          emergencyContact: { relationship: 'Father', name: 'Ramesh Sharma', phone: '9811098765' },
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-7721',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomId: 'rm-102',
          bedId: 'bed-102-2',
          roomNumber: '102',
          bedNumber: 'B2',
          sharingType: '3-Sharing',
          moveInDate: '2026-05-01',
          monthlyRent: 7500,
          securityDeposit: 12000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T09:00:00.000Z',
        },
        {
          id: 'RES-1004',
          applicationId: 'APP-8204',
          fullName: 'Vikram Mehta',
          mobile: '9876501004',
          email: 'vikram.mehta@gmail.com',
          gender: 'Male',
          permanentAddress: 'B-12, Alkapuri, Vadodara, Gujarat',
          occupation: 'Senior Backend Engineer at Amazon',
          emergencyContact: { relationship: 'Brother', name: 'Kunal Mehta', phone: '9825067890' },
          photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-4512',
          buildingId: 'bld-1',
          floorId: 'flr-1',
          roomId: 'rm-103',
          bedId: 'bed-103-1',
          roomNumber: '103',
          bedNumber: 'B1',
          sharingType: 'Single',
          moveInDate: '2026-02-10',
          monthlyRent: 14000,
          securityDeposit: 20000,
          status: 'ACTIVE',
          createdAt: '2026-02-10T14:20:00.000Z',
          notes: 'Single occupancy executive room with work desk.',
        },
        {
          id: 'RES-1005',
          applicationId: 'APP-8205',
          fullName: 'Rahul Verma',
          mobile: '9876501005',
          email: 'rahul.verma@gmail.com',
          gender: 'Male',
          permanentAddress: 'Plot 45, Gomti Nagar, Lucknow, UP',
          occupation: 'Data Scientist at Microsoft',
          emergencyContact: { relationship: 'Father', name: 'Anil Verma', phone: '9415011224' },
          photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-8823',
          buildingId: 'bld-1',
          floorId: 'flr-2',
          roomId: 'rm-201',
          bedId: 'bed-201-1',
          roomNumber: '201',
          bedNumber: 'B1',
          sharingType: '2-Sharing',
          moveInDate: '2026-06-01',
          monthlyRent: 9500,
          securityDeposit: 15000,
          status: 'ACTIVE',
          createdAt: '2026-06-01T12:00:00.000Z',
        },
        {
          id: 'RES-1006',
          applicationId: 'APP-8206',
          fullName: 'Karthik Rao',
          mobile: '9876501006',
          email: 'karthik.rao@gmail.com',
          gender: 'Male',
          permanentAddress: '3-4-128, Barkatpura, Hyderabad, Telangana',
          occupation: 'QA Automation Engineer at TCS',
          emergencyContact: { relationship: 'Father', name: 'Nageshwar Rao', phone: '9848012345' },
          photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-6192',
          buildingId: 'bld-1',
          floorId: 'flr-2',
          roomId: 'rm-202',
          bedId: 'bed-202-1',
          roomNumber: '202',
          bedNumber: 'B1',
          sharingType: '4-Sharing',
          moveInDate: '2026-05-20',
          monthlyRent: 6500,
          securityDeposit: 10000,
          status: 'ACTIVE',
          createdAt: '2026-05-20T10:30:00.000Z',
        },
        {
          id: 'RES-1007',
          applicationId: 'APP-8207',
          fullName: 'Sameer Joshi',
          mobile: '9876501007',
          email: 'sameer.joshi@gmail.com',
          gender: 'Male',
          permanentAddress: '55, Kothrud, Pune, Maharashtra',
          occupation: 'Product Manager at Flipkart',
          emergencyContact: { relationship: 'Mother', name: 'Sunita Joshi', phone: '9822019876' },
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-1945',
          buildingId: 'bld-1',
          floorId: 'flr-2',
          roomId: 'rm-202',
          bedId: 'bed-202-2',
          roomNumber: '202',
          bedNumber: 'B2',
          sharingType: '4-Sharing',
          moveInDate: '2026-01-15',
          monthlyRent: 6500,
          securityDeposit: 10000,
          status: 'NOTICE',
          noticeDate: '2026-08-10',
          createdAt: '2026-01-15T09:15:00.000Z',
          notes: 'Serving 30-day notice period. Vacating on 10 Sept 2026.',
        },
        {
          id: 'RES-1008',
          applicationId: 'APP-8208',
          fullName: 'Arjun Das',
          mobile: '9876501008',
          email: 'arjun.das@gmail.com',
          gender: 'Male',
          permanentAddress: '72/A, Salt Lake Sector 1, Kolkata, West Bengal',
          occupation: 'Frontend Developer at Razorpay',
          emergencyContact: { relationship: 'Father', name: 'Bikram Das', phone: '9830012345' },
          photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharNumberMasked: 'XXXX-XXXX-3382',
          buildingId: 'bld-2',
          floorId: 'flr-b-1',
          roomId: 'rm-b-101',
          bedId: 'bed-b101-1',
          roomNumber: 'B-101',
          bedNumber: 'B1',
          sharingType: '2-Sharing',
          moveInDate: '2026-07-01',
          monthlyRent: 9000,
          securityDeposit: 15000,
          status: 'ACTIVE',
          createdAt: '2026-07-01T15:00:00.000Z',
        },
      ]);

      // 6. Applications
      await ApplicationModel.create([
        {
          id: 'APP-8219',
          status: 'PENDING',
          fullName: 'Prateek Sundaram',
          mobile: '9840123456',
          email: 'prateek.sundaram@gmail.com',
          gender: 'Male',
          dob: '1998-11-22',
          permanentAddress: '24, TTK Road, Alwarpet, Chennai, Tamil Nadu',
          occupation: 'Cloud Engineer at Cisco',
          emergencyContact: { relationship: 'Father', name: 'Sundaram Ramaswamy', phone: '9444012345' },
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
          photoSizeBytes: 180000,
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharSizeBytes: 320000,
          aadharNumberMasked: 'XXXX-XXXX-5521',
          acceptedRulesVersion: 'v1.0 (Aug 2026)',
          acceptedAt: '2026-08-18T14:30:00.000Z',
          submittedAt: '2026-08-18T14:32:00.000Z',
        },
        {
          id: 'APP-8220',
          status: 'PENDING',
          fullName: 'Manish Chawla',
          mobile: '9818099887',
          email: 'manish.chawla@gmail.com',
          gender: 'Male',
          dob: '1999-06-14',
          permanentAddress: 'House 112, Sector 15, Chandigarh',
          occupation: 'UX Researcher at Google',
          emergencyContact: { relationship: 'Father', name: 'Harish Chawla', phone: '9814012345' },
          photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
          photoSizeBytes: 195000,
          aadharUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
          aadharSizeBytes: 310000,
          aadharNumberMasked: 'XXXX-XXXX-8921',
          acceptedRulesVersion: 'v1.0 (Aug 2026)',
          acceptedAt: '2026-08-19T09:10:00.000Z',
          submittedAt: '2026-08-19T09:15:00.000Z',
        },
      ]);

      // 7. Payments
      await PaymentModel.create([
        {
          id: 'PAY-3041',
          residentId: 'RES-1001',
          residentName: 'Rohan Gupta',
          roomNumber: '101',
          bedNumber: 'B1',
          billingMonth: 'August 2026',
          totalDueForMonth: 9500,
          amountPaid: 9500,
          remainingBalance: 0,
          paymentType: 'Rent',
          paymentMethod: 'UPI',
          status: 'Paid',
          transactionReference: 'UPI/260801/829104',
          notes: 'Full rent received on 1st Aug via PhonePe.',
          paidAt: '2026-08-01T10:15:00.000Z',
          recordedBy: 'Admin',
        },
        {
          id: 'PAY-3042',
          residentId: 'RES-1002',
          residentName: 'Siddharth Nair',
          roomNumber: '102',
          bedNumber: 'B1',
          billingMonth: 'August 2026',
          totalDueForMonth: 7500,
          amountPaid: 5000,
          remainingBalance: 2500,
          paymentType: 'Rent',
          paymentMethod: 'UPI',
          status: 'Partially Paid',
          transactionReference: 'UPI/260803/771920',
          notes: 'Part payment ₹5,000 made on 3rd Aug. Promised remaining ₹2,500 by 22nd Aug.',
          paidAt: '2026-08-03T18:40:00.000Z',
          recordedBy: 'Admin',
        },
        {
          id: 'PAY-3043',
          residentId: 'RES-1004',
          residentName: 'Vikram Mehta',
          roomNumber: '103',
          bedNumber: 'B1',
          billingMonth: 'August 2026',
          totalDueForMonth: 14000,
          amountPaid: 14000,
          remainingBalance: 0,
          paymentType: 'Rent',
          paymentMethod: 'Bank Transfer',
          status: 'Paid',
          transactionReference: 'NEFT/HDFC/9921049',
          notes: 'Direct bank transfer credited.',
          paidAt: '2026-08-02T11:00:00.000Z',
          recordedBy: 'Admin',
        },
      ]);

      // 8. Rules
      await RuleModel.create([
        {
          id: 'rul-1',
          title: 'Gate & Curfew Timings',
          description: 'Main PG entry gates will be locked at 10:30 PM. Late entries require prior permission.',
          category: 'Timing',
          order: 1,
          isMandatory: true,
        },
        {
          id: 'rul-2',
          title: 'Visitor Policy',
          description: 'Outside visitors and non-residents are only allowed in the ground floor visitor lounge between 9:00 AM and 8:00 PM. No overnight guests in resident rooms.',
          category: 'Visitors',
          order: 2,
          isMandatory: true,
        },
        {
          id: 'rul-3',
          title: 'Cleanliness & Waste Segregation',
          description: 'Rooms and common corridors must be kept tidy. Daily housekeeping visits between 10:00 AM and 1:00 PM. Waste must be segregated into dry and wet bins.',
          category: 'Cleanliness',
          order: 3,
          isMandatory: true,
        },
        {
          id: 'rul-4',
          title: 'Quiet Hours & Electrical Appliances',
          description: 'Quiet hours are observed strictly from 11:00 PM to 6:00 AM. High-wattage heating coils and induction stoves in bedrooms are strictly prohibited for safety.',
          category: 'Security',
          order: 4,
          isMandatory: true,
        },
        {
          id: 'rul-5',
          title: 'Monthly Rent Payment Schedule',
          description: 'Monthly accommodation fees must be cleared on or before the 5th of every calendar month. Partial payments must be pre-arranged with management.',
          category: 'Payment',
          order: 5,
          isMandatory: true,
        },
        {
          id: 'rul-6',
          title: 'Notice Period for Vacating',
          description: 'Residents wishing to vacate must submit a written 30-day notice via the management portal. Security deposit refund is processed after bed inspection and clearance of dues.',
          category: 'General',
          order: 6,
          isMandatory: true,
        },
      ]);

      // 9. Initial Invite Token
      await InvitationModel.create({
        token: 'welcome-tenant',
        pgName: 'ABC DEF PG',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      });

      console.log('[MongoDB] Initial PG data seeded successfully!');
    }
  } catch (err) {
    console.error('[MongoDB] Error checking/seeding data:', err);
  }
}
