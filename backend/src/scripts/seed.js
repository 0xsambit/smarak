import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserRole, UserSchema } from '../schemas/user.schema.js';
import { Site, ProtectionStatus, RiskLevel, SiteSchema } from '../schemas/site.schema.js';
import {
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  IncidentSchema,
} from '../schemas/incident.schema.js';
import {
  Conservation,
  ConservationStatus,
  ConservationSchema,
} from '../schemas/conservation.schema.js';
import { Approval, ApprovalType, ApprovalStatus, ApprovalSchema } from '../schemas/approval.schema.js';
import { Footfall, FootfallSchema } from '../schemas/footfall.schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritage-db';
const BOOTSTRAP_ADMIN = {
  clerkId: process.env.BOOTSTRAP_ADMIN_CLERK_ID,
  email: process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase(),
  name: process.env.BOOTSTRAP_ADMIN_NAME || 'Bootstrap Admin',
};

const daysAgo = (days, hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 0, 0, 0);
  return date;
};

async function seed() {
  try {
    if (!BOOTSTRAP_ADMIN.clerkId || !BOOTSTRAP_ADMIN.email) {
      throw new Error('BOOTSTRAP_ADMIN_CLERK_ID and BOOTSTRAP_ADMIN_EMAIL must be set before seeding.');
    }

    console.log('Starting Atlas seed...\n');

    await connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const UserModel = connection.model(User.name, UserSchema);
    const SiteModel = connection.model(Site.name, SiteSchema);
    const IncidentModel = connection.model(Incident.name, IncidentSchema);
    const ConservationModel = connection.model(Conservation.name, ConservationSchema);
    const ApprovalModel = connection.model(Approval.name, ApprovalSchema);
    const FootfallModel = connection.model(Footfall.name, FootfallSchema);

    const bootstrapUser = await UserModel.findOneAndUpdate(
      { clerkId: BOOTSTRAP_ADMIN.clerkId },
      {
        clerkId: BOOTSTRAP_ADMIN.clerkId,
        email: BOOTSTRAP_ADMIN.email,
        name: BOOTSTRAP_ADMIN.name,
        role: UserRole.NATIONAL_ADMIN,
        isActive: true,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    console.log(`Bootstrap admin ready: ${bootstrapUser.email}\n`);

    await Promise.all([
      SiteModel.deleteMany({}),
      IncidentModel.deleteMany({}),
      ConservationModel.deleteMany({}),
      ApprovalModel.deleteMany({}),
      FootfallModel.deleteMany({}),
    ]);
    console.log('Cleared existing business data\n');

    console.log('Creating heritage sites...');
    const sites = await SiteModel.insertMany([
      {
        name: 'Taj Mahal',
        state: 'Uttar Pradesh',
        district: 'Agra',
        coordinates: { type: 'Point', coordinates: [78.0421, 27.1751] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: daysAgo(18),
        visitorCapacity: 40000,
        description: 'Iconic white marble mausoleum on the south bank of the Yamuna river.',
      },
      {
        name: 'Qutub Minar',
        state: 'Delhi',
        district: 'South Delhi',
        coordinates: { type: 'Point', coordinates: [77.1855, 28.5245] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: daysAgo(11),
        visitorCapacity: 15000,
        description: 'Tallest brick minaret in the world.',
      },
      {
        name: 'Red Fort',
        state: 'Delhi',
        district: 'Central Delhi',
        coordinates: { type: 'Point', coordinates: [77.241, 28.6562] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.HIGH,
        lastInspectionDate: daysAgo(29),
        visitorCapacity: 25000,
        description: 'Historic fortified palace complex in Old Delhi.',
      },
      {
        name: 'Charminar',
        state: 'Telangana',
        district: 'Hyderabad',
        coordinates: { type: 'Point', coordinates: [78.4747, 17.3616] },
        protectionStatus: ProtectionStatus.RESTRICTED,
        riskLevel: RiskLevel.HIGH,
        lastInspectionDate: daysAgo(14),
        visitorCapacity: 10000,
        description: 'Monument and mosque in Hyderabad.',
      },
      {
        name: 'Ajanta Caves',
        state: 'Maharashtra',
        district: 'Aurangabad',
        coordinates: { type: 'Point', coordinates: [75.7033, 20.5519] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: daysAgo(17),
        visitorCapacity: 5000,
        description: 'Rock-cut Buddhist cave monuments dating from the second century BCE.',
      },
      {
        name: 'Hawa Mahal',
        state: 'Rajasthan',
        district: 'Jaipur',
        coordinates: { type: 'Point', coordinates: [75.8267, 26.9239] },
        protectionStatus: ProtectionStatus.OPEN,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: daysAgo(9),
        visitorCapacity: 8000,
        description: 'Palace of Winds with a distinctive honeycomb facade.',
      },
      {
        name: 'Konark Sun Temple',
        state: 'Odisha',
        district: 'Puri',
        coordinates: { type: 'Point', coordinates: [86.0945, 19.8876] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: daysAgo(16),
        visitorCapacity: 12000,
        description: '13th-century Sun Temple dedicated to Surya.',
      },
      {
        name: 'Hampi',
        state: 'Karnataka',
        district: 'Ballari',
        coordinates: { type: 'Point', coordinates: [76.4629, 15.335] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: daysAgo(8),
        visitorCapacity: 6000,
        description: 'Ancient Vijayanagara Empire ruins spread across a vast landscape.',
      },
    ]);
    console.log(`Created ${sites.length} sites\n`);

    console.log('Creating incidents...');
    const incidents = await IncidentModel.insertMany([
      {
        siteId: sites[0]._id,
        type: IncidentType.STRUCTURAL,
        severity: IncidentSeverity.MEDIUM,
        description: 'Minor cracks observed in the north-east minaret foundation.',
        status: IncidentStatus.IN_PROGRESS,
        images: [],
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(2),
      },
      {
        siteId: sites[2]._id,
        type: IncidentType.VANDALISM,
        severity: IncidentSeverity.HIGH,
        description: 'Graffiti found on the outer walls near the Lahori Gate.',
        status: IncidentStatus.OPEN,
        images: [],
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
      },
      {
        siteId: sites[3]._id,
        type: IncidentType.OVERCROWDING,
        severity: IncidentSeverity.HIGH,
        description: 'Visitor capacity exceeded during a festival period, causing safety concerns.',
        status: IncidentStatus.OPEN,
        images: [],
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        siteId: sites[4]._id,
        type: IncidentType.ENVIRONMENTAL,
        severity: IncidentSeverity.MEDIUM,
        description: 'Water seepage detected in Cave 1 due to monsoon moisture.',
        status: IncidentStatus.IN_PROGRESS,
        images: [],
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      },
      {
        siteId: sites[1]._id,
        type: IncidentType.SECURITY,
        severity: IncidentSeverity.LOW,
        description: 'Security camera malfunction in the eastern sector.',
        status: IncidentStatus.RESOLVED,
        resolvedAt: daysAgo(1),
        resolutionNotes: 'Camera replaced and tested successfully.',
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(1),
      },
      {
        siteId: sites[6]._id,
        type: IncidentType.STRUCTURAL,
        severity: IncidentSeverity.HIGH,
        description: 'Loose stones detected near the temple courtyard path.',
        status: IncidentStatus.OPEN,
        images: [],
        reportedBy: bootstrapUser._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    ]);
    console.log(`Created ${incidents.length} incidents\n`);

    console.log('Creating conservation projects...');
    const conservationProjects = await ConservationModel.insertMany([
      {
        siteId: sites[0]._id,
        issueType: 'Marble Restoration',
        title: 'Taj Mahal Marble Cleaning and Restoration Phase 3',
        description: 'Comprehensive marble surface cleaning and restoration of yellowing patches.',
        contractor: 'ASI Heritage Conservation Division',
        budget: 15000000,
        status: ConservationStatus.ONGOING,
        startDate: daysAgo(120),
        beforeImages: [],
        afterImages: [],
        createdBy: bootstrapUser._id,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(2),
      },
      {
        siteId: sites[2]._id,
        issueType: 'Wall Restoration',
        title: 'Red Fort Eastern Wall Structural Reinforcement',
        description: 'Reinforcement and restoration of deteriorating sections of the eastern wall.',
        contractor: 'Delhi Archaeological Conservation Ltd',
        budget: 8500000,
        status: ConservationStatus.PLANNED,
        startDate: daysAgo(-7),
        beforeImages: [],
        afterImages: [],
        createdBy: bootstrapUser._id,
        createdAt: daysAgo(9),
        updatedAt: daysAgo(4),
      },
      {
        siteId: sites[4]._id,
        issueType: 'Painting Preservation',
        title: 'Ajanta Cave Murals Digital Documentation and Preservation',
        description: 'High-resolution digital documentation and environmental control implementation.',
        contractor: 'National Museum Conservation Lab',
        budget: 12000000,
        status: ConservationStatus.ONGOING,
        startDate: daysAgo(140),
        beforeImages: [],
        afterImages: [],
        createdBy: bootstrapUser._id,
        createdAt: daysAgo(24),
        updatedAt: daysAgo(3),
      },
      {
        siteId: sites[5]._id,
        issueType: 'Window Restoration',
        title: 'Hawa Mahal Jharokha Restoration',
        description: 'Restoration of damaged sandstone jharokhas on the facade.',
        contractor: 'Rajasthan Heritage Trust',
        budget: 4500000,
        status: ConservationStatus.COMPLETED,
        startDate: daysAgo(200),
        endDate: daysAgo(20),
        completionNotes: 'All windows restored successfully.',
        beforeImages: [],
        afterImages: [],
        createdBy: bootstrapUser._id,
        createdAt: daysAgo(60),
        updatedAt: daysAgo(20),
      },
    ]);
    console.log(`Created ${conservationProjects.length} conservation projects\n`);

    console.log('Creating approvals...');
    const approvals = await ApprovalModel.insertMany([
      {
        type: ApprovalType.CONSERVATION,
        title: 'Taj Mahal Phase 4 Conservation Budget Approval',
        description: 'Requesting budget approval for the next marble restoration phase.',
        referenceId: conservationProjects[0]._id,
        submittedBy: bootstrapUser._id,
        status: ApprovalStatus.PENDING,
        isPriority: true,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
      {
        type: ApprovalType.INCIDENT,
        title: 'Red Fort Vandalism Response Plan Approval',
        description: 'Approval for emergency response and enhanced security measures.',
        referenceId: incidents[1]._id,
        submittedBy: bootstrapUser._id,
        status: ApprovalStatus.PENDING,
        isPriority: true,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        type: ApprovalType.BUDGET,
        title: 'Charminar Visitor Management System Upgrade',
        description: 'Budget approval for digital ticketing and crowd control improvements.',
        referenceId: sites[3]._id,
        submittedBy: bootstrapUser._id,
        status: ApprovalStatus.APPROVED,
        reviewedBy: bootstrapUser._id,
        reviewedAt: daysAgo(6),
        reviewNotes: 'Approved with full budget allocation.',
        isPriority: false,
        createdAt: daysAgo(8),
        updatedAt: daysAgo(6),
      },
      {
        type: ApprovalType.REPORT,
        title: 'Annual Conservation Report 2025-26',
        description: 'Quarterly conservation activities report for submission.',
        referenceId: sites[0]._id,
        submittedBy: bootstrapUser._id,
        status: ApprovalStatus.PENDING,
        isPriority: false,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    ]);
    console.log(`Created ${approvals.length} approvals\n`);

    console.log('Creating footfall data...');
    const footfallRecords = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      sites.forEach((site, index) => {
        const baseVisitors = Math.floor(site.visitorCapacity * 0.3);
        const variance = Math.floor(baseVisitors * 0.3);
        const randomVisitors = baseVisitors + Math.floor(Math.random() * Math.max(variance, 1));
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const visitors = isWeekend ? Math.floor(randomVisitors * 1.4) : randomVisitors;

        footfallRecords.push({
          siteId: site._id,
          date,
          visitors,
          revenue: visitors * (100 + index * 20),
          peakHour: isWeekend ? '11:00 AM' : '2:00 PM',
        });
      });
    }

    await FootfallModel.insertMany(footfallRecords);
    console.log(`Created ${footfallRecords.length} footfall records\n`);

    console.log('Seed complete.');
    console.log(`Sites: ${sites.length}`);
    console.log(`Incidents: ${incidents.length}`);
    console.log(`Conservation projects: ${conservationProjects.length}`);
    console.log(`Approvals: ${approvals.length}`);
    console.log(`Footfall records: ${footfallRecords.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
