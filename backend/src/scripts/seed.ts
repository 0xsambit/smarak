import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserRole, UserSchema } from '../schemas/user.schema';
import { Site, ProtectionStatus, RiskLevel, SiteSchema } from '../schemas/site.schema';
import {
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  IncidentSchema,
} from '../schemas/incident.schema';
import {
  Conservation,
  ConservationStatus,
  ConservationSchema,
} from '../schemas/conservation.schema';
import { Approval, ApprovalType, ApprovalStatus, ApprovalSchema } from '../schemas/approval.schema';
import { Footfall, FootfallSchema } from '../schemas/footfall.schema';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritage-db';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create models
    const UserModel = connection.model('User', UserSchema);
    const SiteModel = connection.model('Site', SiteSchema);
    const IncidentModel = connection.model('Incident', IncidentSchema);
    const ConservationModel = connection.model('Conservation', ConservationSchema);
    const ApprovalModel = connection.model('Approval', ApprovalSchema);
    const FootfallModel = connection.model('Footfall', FootfallSchema);

    // Clear existing data (excluding users - they're managed by Clerk)
    await Promise.all([
      SiteModel.deleteMany({}),
      IncidentModel.deleteMany({}),
      ConservationModel.deleteMany({}),
      ApprovalModel.deleteMany({}),
      FootfallModel.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');
    console.log('ℹ️  Note: Users are created via Clerk authentication, not seeded\n');

    // Create heritage sites
    console.log('🏛️  Creating heritage sites...');
    const sites = await SiteModel.insertMany([
      {
        name: 'Taj Mahal',
        state: 'Uttar Pradesh',
        district: 'Agra',
        coordinates: { type: 'Point', coordinates: [78.0421, 27.1751] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: new Date('2026-01-15'),
        visitorCapacity: 40000,
        description: 'Iconic white marble mausoleum on the south bank of the Yamuna river',
      },
      {
        name: 'Qutub Minar',
        state: 'Delhi',
        district: 'South Delhi',
        coordinates: { type: 'Point', coordinates: [77.1855, 28.5245] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: new Date('2026-02-01'),
        visitorCapacity: 15000,
        description: 'Tallest brick minaret in the world',
      },
      {
        name: 'Red Fort',
        state: 'Delhi',
        district: 'Central Delhi',
        coordinates: { type: 'Point', coordinates: [77.2410, 28.6562] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.HIGH,
        lastInspectionDate: new Date('2025-12-20'),
        visitorCapacity: 25000,
        description: 'Historic fortified palace complex',
      },
      {
        name: 'Charminar',
        state: 'Telangana',
        district: 'Hyderabad',
        coordinates: { type: 'Point', coordinates: [78.4747, 17.3616] },
        protectionStatus: ProtectionStatus.RESTRICTED,
        riskLevel: RiskLevel.HIGH,
        lastInspectionDate: new Date('2026-01-10'),
        visitorCapacity: 10000,
        description: 'Monument and mosque in Hyderabad',
      },
      {
        name: 'Ajanta Caves',
        state: 'Maharashtra',
        district: 'Aurangabad',
        coordinates: { type: 'Point', coordinates: [75.7033, 20.5519] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: new Date('2026-01-25'),
        visitorCapacity: 5000,
        description: 'Rock-cut Buddhist cave monuments',
      },
      {
        name: 'Hawa Mahal',
        state: 'Rajasthan',
        district: 'Jaipur',
        coordinates: { type: 'Point', coordinates: [75.8267, 26.9239] },
        protectionStatus: ProtectionStatus.OPEN,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: new Date('2026-02-05'),
        visitorCapacity: 8000,
        description: 'Palace of Winds with unique honeycomb structure',
      },
      {
        name: 'Konark Sun Temple',
        state: 'Odisha',
        district: 'Puri',
        coordinates: { type: 'Point', coordinates: [86.0945, 19.8876] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.MEDIUM,
        lastInspectionDate: new Date('2026-01-20'),
        visitorCapacity: 12000,
        description: '13th-century Sun Temple',
      },
      {
        name: 'Hampi',
        state: 'Karnataka',
        district: 'Ballari',
        coordinates: { type: 'Point', coordinates: [76.4629, 15.3350] },
        protectionStatus: ProtectionStatus.PROTECTED,
        riskLevel: RiskLevel.LOW,
        lastInspectionDate: new Date('2026-02-08'),
        visitorCapacity: 6000,
        description: 'Ancient Vijayanagara Empire ruins',
      },
    ]);
    console.log(`✅ Created ${sites.length} heritage sites\n`);

    // Create incidents
    console.log('⚠️  Creating incidents...');
    const incidents = await IncidentModel.insertMany([
      {
        siteId: sites[0]._id, // Taj Mahal
        type: IncidentType.STRUCTURAL,
        severity: IncidentSeverity.MEDIUM,
        description: 'Minor cracks observed in the north-east minaret foundation',
        status: IncidentStatus.IN_PROGRESS,
        images: [],
      },
      {
        siteId: sites[2]._id, // Red Fort
        type: IncidentType.VANDALISM,
        severity: IncidentSeverity.HIGH,
        description: 'Graffiti found on the outer walls near the Lahori Gate',
        status: IncidentStatus.OPEN,
        images: [],
      },
      {
        siteId: sites[3]._id, // Charminar
        type: IncidentType.OVERCROWDING,
        severity: IncidentSeverity.HIGH,
        description: 'Visitor capacity exceeded during festival period causing safety concerns',
        status: IncidentStatus.OPEN,
        images: [],
      },
      {
        siteId: sites[4]._id, // Ajanta Caves
        type: IncidentType.ENVIRONMENTAL,
        severity: IncidentSeverity.MEDIUM,
        description: 'Water seepage detected in Cave 1 due to monsoon',
        status: IncidentStatus.IN_PROGRESS,
        images: [],
      },
      {
        siteId: sites[1]._id, // Qutub Minar
        type: IncidentType.SECURITY,
        severity: IncidentSeverity.LOW,
        description: 'Security camera malfunction in the eastern sector',
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date('2026-02-10'),
        resolutionNotes: 'Camera replaced and tested successfully',
      },
      {
        siteId: sites[6]._id, // Konark
        type: IncidentType.STRUCTURAL,
        severity: IncidentSeverity.LOW,
        description: 'Loose stones detected in the temple courtyard path',
        status: IncidentStatus.OPEN,
        images: [],
      },
    ]);
    console.log(`✅ Created ${incidents.length} incidents\n`);

    // Create conservation projects
    console.log('🔧 Creating conservation projects...');
    const conservationProjects = await ConservationModel.insertMany([
      {
        siteId: sites[0]._id, // Taj Mahal
        issueType: 'Marble Restoration',
        title: 'Taj Mahal Marble Cleaning and Restoration Phase 3',
        description: 'Comprehensive marble surface cleaning and restoration of yellowing patches',
        contractor: 'ASI Heritage Conservation Division',
        budget: 15000000,
        status: ConservationStatus.ONGOING,
        startDate: new Date('2025-11-01'),
        beforeImages: [],
        afterImages: [],
      },
      {
        siteId: sites[2]._id, // Red Fort
        issueType: 'Wall Restoration',
        title: 'Red Fort Eastern Wall Structural Reinforcement',
        description: 'Reinforcement and restoration of deteriorating sections of the eastern wall',
        contractor: 'Delhi Archaeological Conservation Ltd',
        budget: 8500000,
        status: ConservationStatus.PLANNED,
        startDate: new Date('2026-03-15'),
        beforeImages: [],
        afterImages: [],
      },
      {
        siteId: sites[4]._id, // Ajanta Caves
        issueType: 'Painting Preservation',
        title: 'Ajanta Cave Murals Digital Documentation and Preservation',
        description: 'High-resolution digital documentation and environmental control implementation',
        contractor: 'National Museum Conservation Lab',
        budget: 12000000,
        status: ConservationStatus.ONGOING,
        startDate: new Date('2025-10-01'),
        beforeImages: [],
        afterImages: [],
      },
      {
        siteId: sites[5]._id, // Hawa Mahal
        issueType: 'Window Restoration',
        title: 'Hawa Mahal Jharokha (Window) Restoration',
        description: 'Restoration of damaged sandstone jharokhas on the facade',
        contractor: 'Rajasthan Heritage Trust',
        budget: 4500000,
        status: ConservationStatus.COMPLETED,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-01-31'),
        completionNotes: 'All 953 windows restored successfully',
        beforeImages: [],
        afterImages: [],
      },
    ]);
    console.log(`✅ Created ${conservationProjects.length} conservation projects\n`);

    // Create approvals
    console.log('📋 Creating approval requests...');
    const approvals = await ApprovalModel.insertMany([
      {
        type: ApprovalType.CONSERVATION,
        title: 'Taj Mahal Phase 4 Conservation Budget Approval',
        description: 'Requesting budget approval for next phase of marble restoration',
        referenceId: conservationProjects[0]._id,
        status: ApprovalStatus.PENDING,
        isPriority: true,
      },
      {
        type: ApprovalType.INCIDENT,
        title: 'Red Fort Vandalism Response Plan Approval',
        description: 'Approval for emergency response and enhanced security measures',
        referenceId: incidents[1]._id,
        status: ApprovalStatus.PENDING,
        isPriority: true,
      },
      {
        type: ApprovalType.BUDGET,
        title: 'Charminar Visitor Management System Upgrade',
        description: 'Budget approval for digital ticketing and crowd control system',
        referenceId: sites[3]._id,
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date('2026-02-08'),
        reviewNotes: 'Approved with full budget allocation',
        isPriority: false,
      },
      {
        type: ApprovalType.REPORT,
        title: 'Annual Conservation Report 2025-26',
        description: 'Quarterly conservation activities report for submission',
        referenceId: sites[0]._id,
        status: ApprovalStatus.PENDING,
        isPriority: false,
      },
    ]);
    console.log(`✅ Created ${approvals.length} approval requests\n`);

    // Create footfall data for last 30 days
    console.log('📊 Creating footfall data...');
    const footfallRecords: any[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate footfall for each site with realistic patterns
      sites.forEach((site, index) => {
        const baseVisitors = Math.floor(site.visitorCapacity * 0.3);
        const variance = Math.floor(baseVisitors * 0.3);
        const randomVisitors = baseVisitors + Math.floor(Math.random() * variance);

        // Weekend boost
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const visitors = isWeekend ? Math.floor(randomVisitors * 1.4) : randomVisitors;

        footfallRecords.push({
          siteId: site._id,
          date: date,
          visitors: visitors,
          revenue: visitors * (100 + index * 20), // Varying ticket prices
          peakHour: isWeekend ? '11:00 AM' : '2:00 PM',
        });
      });
    }

    await FootfallModel.insertMany(footfallRecords);
    console.log(`✅ Created ${footfallRecords.length} footfall records\n`);

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📈 Summary:');
    console.log(`   - Sites: ${sites.length}`);
    console.log(`   - Incidents: ${incidents.length}`);
    console.log(`   - Conservation Projects: ${conservationProjects.length}`);
    console.log(`   - Approvals: ${approvals.length}`);
    console.log(`   - Footfall Records: ${footfallRecords.length}`);
    console.log('\n   ℹ️  Note: Users are created via Clerk authentication\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
