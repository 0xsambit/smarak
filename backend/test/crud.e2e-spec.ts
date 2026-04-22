import { CanActivate, ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request, { type Test as SupertestRequest } from 'supertest';
import { Model, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { ClerkAuthGuard } from '../src/common/guards/clerk-auth.guard';
import { Approval, ApprovalStatus, ApprovalType } from '../src/schemas/approval.schema';
import { Conservation, ConservationStatus } from '../src/schemas/conservation.schema';
import { Footfall } from '../src/schemas/footfall.schema';
import { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../src/schemas/incident.schema';
import { ProtectionStatus, RiskLevel, Site } from '../src/schemas/site.schema';
import { User, UserRole } from '../src/schemas/user.schema';

type Actor = {
  _id: string;
  role: UserRole;
  clerkId: string;
  email: string;
  name: string;
  siteId?: string;
  stateId?: string;
};

class TestClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const encodedActor = request.headers['x-test-user'];

    if (!encodedActor || Array.isArray(encodedActor)) {
      throw new UnauthorizedException('Missing x-test-user header');
    }

    request.user = JSON.parse(Buffer.from(encodedActor, 'base64').toString('utf8'));
    return true;
  }
}

const encodeActor = (actor: Actor) => Buffer.from(JSON.stringify(actor)).toString('base64');

const withActor = (req: SupertestRequest, actor: Actor) => req.set('x-test-user', encodeActor(actor));

const buildActor = (role: UserRole, overrides: Partial<Actor> = {}): Actor => {
  const id = overrides._id || new Types.ObjectId().toString();

  return {
    _id: id,
    role,
    clerkId: overrides.clerkId || `clerk-${id}`,
    email: overrides.email || `${role.toLowerCase()}-${id}@example.com`,
    name: overrides.name || `${role} User`,
    siteId: overrides.siteId,
    stateId: overrides.stateId,
  };
};

const buildSitePayload = (overrides: Record<string, unknown> = {}) => ({
  name: 'Humayun Tomb',
  state: 'Delhi',
  district: 'New Delhi',
  coordinates: {
    longitude: 77.2507,
    latitude: 28.5933,
  },
  protectionStatus: ProtectionStatus.PROTECTED,
  riskLevel: RiskLevel.MEDIUM,
  visitorCapacity: 18000,
  description: 'UNESCO heritage monument.',
  ...overrides,
});

describe('CRUD API regression suite', () => {
  let mongoServer: MongoMemoryServer;
  let app: INestApplication;
  let httpServer: ReturnType<typeof request>;
  let moduleRef: TestingModule;

  let siteModel: Model<Site>;
  let incidentModel: Model<Incident>;
  let conservationModel: Model<Conservation>;
  let approvalModel: Model<Approval>;
  let userModel: Model<User>;
  let footfallModel: Model<Footfall>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.CLERK_SECRET_KEY = 'test-secret-key';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    process.env.RATE_LIMIT_TTL = '900000';
    process.env.RATE_LIMIT_MAX = '1000';
    process.env.PORT = '8080';

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(TestClerkAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    httpServer = request(app.getHttpServer());
    siteModel = moduleRef.get<Model<Site>>(getModelToken(Site.name));
    incidentModel = moduleRef.get<Model<Incident>>(getModelToken(Incident.name));
    conservationModel = moduleRef.get<Model<Conservation>>(getModelToken(Conservation.name));
    approvalModel = moduleRef.get<Model<Approval>>(getModelToken(Approval.name));
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
    footfallModel = moduleRef.get<Model<Footfall>>(getModelToken(Footfall.name));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      approvalModel.deleteMany({}),
      conservationModel.deleteMany({}),
      incidentModel.deleteMany({}),
      footfallModel.deleteMany({}),
      siteModel.deleteMany({}),
      userModel.deleteMany({}),
    ]);
  });

  const persistActor = async (actor: Actor) => {
    await userModel.create({
      _id: actor._id,
      clerkId: actor.clerkId,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      siteId: actor.siteId,
      stateId: actor.stateId,
      isActive: true,
    });

    return actor;
  };

  describe('sites', () => {
    it('completes site CRUD with stable Mongo identifiers in list and detail responses', async () => {
      const nationalAdmin = await persistActor(buildActor(UserRole.NATIONAL_ADMIN));

      const createResponse = await withActor(
        httpServer.post('/api/sites').send(buildSitePayload()),
        nationalAdmin,
      ).expect(201);

      expect(createResponse.body._id).toEqual(expect.any(String));
      expect(createResponse.body.name).toBe('Humayun Tomb');

      const siteId = createResponse.body._id;

      const listResponse = await withActor(
        httpServer.get('/api/sites').query({ limit: 10 }),
        nationalAdmin,
      ).expect(200);

      expect(listResponse.body.sites).toHaveLength(1);
      expect(listResponse.body.sites[0]._id).toBe(siteId);

      const detailResponse = await withActor(
        httpServer.get(`/api/sites/${siteId}`),
        nationalAdmin,
      ).expect(200);

      expect(detailResponse.body._id).toBe(siteId);
      expect(detailResponse.body.coordinates.coordinates).toEqual([77.2507, 28.5933]);

      const updateResponse = await withActor(
        httpServer
          .patch(`/api/sites/${siteId}`)
          .send({ riskLevel: RiskLevel.HIGH, visitorCapacity: 22000 }),
        nationalAdmin,
      ).expect(200);

      expect(updateResponse.body._id).toBe(siteId);
      expect(updateResponse.body.riskLevel).toBe(RiskLevel.HIGH);
      expect(updateResponse.body.visitorCapacity).toBe(22000);

      await withActor(httpServer.delete(`/api/sites/${siteId}`), nationalAdmin).expect(200);

      const archivedList = await withActor(
        httpServer.get('/api/sites').query({ archived: true }),
        nationalAdmin,
      ).expect(200);

      expect(archivedList.body.sites).toHaveLength(1);
      expect(archivedList.body.sites[0]._id).toBe(siteId);

      const restoreResponse = await withActor(
        httpServer.patch(`/api/sites/${siteId}/restore`),
        nationalAdmin,
      ).expect(200);

      expect(restoreResponse.body._id).toBe(siteId);

      const restoredList = await withActor(httpServer.get('/api/sites'), nationalAdmin).expect(200);
      expect(restoredList.body.sites).toHaveLength(1);
      expect(restoredList.body.sites[0]._id).toBe(siteId);
    });

    it('enforces state and site scoping for reads and writes', async () => {
      const delhiSite = await siteModel.create(buildSitePayload({ name: 'Red Fort', state: 'Delhi' }));
      const jaipurSite = await siteModel.create(
        buildSitePayload({
          name: 'Hawa Mahal',
          state: 'Rajasthan',
          district: 'Jaipur',
          coordinates: { longitude: 75.8267, latitude: 26.9239 },
        }),
      );

      const stateAdmin = await persistActor(
        buildActor(UserRole.STATE_ADMIN, { stateId: delhiSite._id.toString() }),
      );
      const siteOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: delhiSite._id.toString() }),
      );

      const scopedList = await withActor(httpServer.get('/api/sites'), stateAdmin).expect(200);

      expect(scopedList.body.sites).toHaveLength(1);
      expect(scopedList.body.sites[0]._id).toBe(delhiSite._id.toString());

      await withActor(
        httpServer.post('/api/sites').send(buildSitePayload({ state: 'Rajasthan', district: 'Jodhpur' })),
        stateAdmin,
      ).expect(403);

      await withActor(httpServer.get(`/api/sites/${jaipurSite._id.toString()}`), siteOfficer).expect(403);
    });
  });

  describe('incidents', () => {
    it('supports incident CRUD with status transition protection and scoped access', async () => {
      const site = await siteModel.create(buildSitePayload());
      const siteOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: site._id.toString() }),
      );
      const stateAdmin = await persistActor(
        buildActor(UserRole.STATE_ADMIN, { stateId: site._id.toString() }),
      );

      const createResponse = await withActor(
        httpServer.post('/api/incidents').send({
          siteId: site._id.toString(),
          type: IncidentType.STRUCTURAL,
          severity: IncidentSeverity.HIGH,
          description: 'Cracks were found near the entry arch.',
        }),
        siteOfficer,
      ).expect(201);

      const incidentId = createResponse.body._id;
      expect(incidentId).toEqual(expect.any(String));

      const listResponse = await withActor(httpServer.get('/api/incidents'), siteOfficer).expect(200);
      expect(listResponse.body.incidents).toHaveLength(1);
      expect(listResponse.body.incidents[0]._id).toBe(incidentId);
      expect(listResponse.body.incidents[0].siteId._id).toBe(site._id.toString());

      const detailResponse = await withActor(
        httpServer.get(`/api/incidents/${incidentId}`),
        siteOfficer,
      ).expect(200);
      expect(detailResponse.body._id).toBe(incidentId);

      const resolveResponse = await withActor(
        httpServer.patch(`/api/incidents/${incidentId}`).send({
          status: IncidentStatus.RESOLVED,
          resolutionNotes: 'Temporary reinforcement installed.',
        }),
        siteOfficer,
      ).expect(200);

      expect(resolveResponse.body.status).toBe(IncidentStatus.RESOLVED);
      expect(resolveResponse.body.resolvedAt).toEqual(expect.any(String));

      await withActor(
        httpServer.patch(`/api/incidents/${incidentId}`).send({ description: 'Another edit attempt' }),
        siteOfficer,
      ).expect(400);

      await withActor(httpServer.delete(`/api/incidents/${incidentId}`), stateAdmin).expect(200);

      const archivedResponse = await withActor(
        httpServer.get('/api/incidents').query({ archived: true }),
        stateAdmin,
      ).expect(200);
      expect(archivedResponse.body.incidents).toHaveLength(1);
      expect(archivedResponse.body.incidents[0]._id).toBe(incidentId);

      const restoreResponse = await withActor(
        httpServer.patch(`/api/incidents/${incidentId}/restore`),
        stateAdmin,
      ).expect(200);

      expect(restoreResponse.body._id).toBe(incidentId);
    });

    it('blocks site officers from creating incidents outside their assigned site', async () => {
      const allowedSite = await siteModel.create(buildSitePayload({ name: 'Allowed Site' }));
      const otherSite = await siteModel.create(
        buildSitePayload({
          name: 'Blocked Site',
          district: 'Agra',
          state: 'Uttar Pradesh',
          coordinates: { longitude: 78.0421, latitude: 27.1751 },
        }),
      );

      const siteOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: allowedSite._id.toString() }),
      );

      await withActor(
        httpServer.post('/api/incidents').send({
          siteId: otherSite._id.toString(),
          type: IncidentType.SECURITY,
          severity: IncidentSeverity.MEDIUM,
          description: 'Access control issue reported.',
        }),
        siteOfficer,
      ).expect(403);
    });
  });

  describe('conservation', () => {
    it('supports conservation CRUD and preserves scope checks', async () => {
      const site = await siteModel.create(buildSitePayload());
      const nationalAdmin = await persistActor(buildActor(UserRole.NATIONAL_ADMIN));
      const stateAdmin = await persistActor(
        buildActor(UserRole.STATE_ADMIN, { stateId: site._id.toString() }),
      );

      const createResponse = await withActor(
        httpServer.post('/api/conservation').send({
          siteId: site._id.toString(),
          issueType: 'Stone Preservation',
          title: 'North Wall Stabilization',
          description: 'Stabilize the weathered northern wall.',
          contractor: 'ASI Works Division',
          budget: 1250000,
          status: ConservationStatus.ONGOING,
          startDate: '2026-04-01',
        }),
        stateAdmin,
      ).expect(201);

      const projectId = createResponse.body._id;
      expect(projectId).toEqual(expect.any(String));

      const listResponse = await withActor(httpServer.get('/api/conservation'), stateAdmin).expect(200);
      expect(listResponse.body.projects).toHaveLength(1);
      expect(listResponse.body.projects[0]._id).toBe(projectId);

      const detailResponse = await withActor(
        httpServer.get(`/api/conservation/${projectId}`),
        stateAdmin,
      ).expect(200);
      expect(detailResponse.body._id).toBe(projectId);

      const updateResponse = await withActor(
        httpServer.patch(`/api/conservation/${projectId}`).send({
          status: ConservationStatus.COMPLETED,
          completionNotes: 'Structural reinforcement completed.',
          endDate: '2026-04-09',
        }),
        stateAdmin,
      ).expect(200);

      expect(updateResponse.body.status).toBe(ConservationStatus.COMPLETED);
      expect(updateResponse.body.completionNotes).toBe('Structural reinforcement completed.');

      await withActor(httpServer.delete(`/api/conservation/${projectId}`), nationalAdmin).expect(200);

      const archivedResponse = await withActor(
        httpServer.get('/api/conservation').query({ archived: true }),
        nationalAdmin,
      ).expect(200);
      expect(archivedResponse.body.projects).toHaveLength(1);
      expect(archivedResponse.body.projects[0]._id).toBe(projectId);

      const restoreResponse = await withActor(
        httpServer.patch(`/api/conservation/${projectId}/restore`),
        nationalAdmin,
      ).expect(200);

      expect(restoreResponse.body._id).toBe(projectId);
    });

    it('blocks out-of-scope and non-admin conservation writes', async () => {
      const delhiSite = await siteModel.create(buildSitePayload({ name: 'Purana Qila' }));
      const otherSite = await siteModel.create(
        buildSitePayload({
          name: 'Konark Sun Temple',
          state: 'Odisha',
          district: 'Puri',
          coordinates: { longitude: 86.0945, latitude: 19.8876 },
        }),
      );

      const stateAdmin = await persistActor(
        buildActor(UserRole.STATE_ADMIN, { stateId: delhiSite._id.toString() }),
      );
      const siteOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: delhiSite._id.toString() }),
      );

      await withActor(
        httpServer.post('/api/conservation').send({
          siteId: otherSite._id.toString(),
          issueType: 'Drainage',
          title: 'Monsoon Readiness',
          description: 'Upgrade drainage before monsoon.',
          contractor: 'Regional Works Team',
          budget: 500000,
          status: ConservationStatus.PLANNED,
          startDate: '2026-05-01',
        }),
        stateAdmin,
      ).expect(403);

      await withActor(
        httpServer.post('/api/conservation').send({
          siteId: delhiSite._id.toString(),
          issueType: 'Painting',
          title: 'Mural Cleaning',
          description: 'Site officer should not create this.',
          contractor: 'Vendor',
          budget: 400000,
          status: ConservationStatus.PLANNED,
          startDate: '2026-05-02',
        }),
        siteOfficer,
      ).expect(403);
    });
  });

  describe('approvals', () => {
    it('supports approval CRUD, review, archive, and ownership rules', async () => {
      const site = await siteModel.create(buildSitePayload());
      const incident = await incidentModel.create({
        siteId: site._id,
        type: IncidentType.VANDALISM,
        severity: IncidentSeverity.MEDIUM,
        description: 'Graffiti on the perimeter wall.',
        status: IncidentStatus.OPEN,
        reportedBy: new Types.ObjectId(),
      });

      const siteOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: site._id.toString() }),
      );
      const secondOfficer = await persistActor(
        buildActor(UserRole.SITE_OFFICER, { siteId: site._id.toString() }),
      );
      const stateAdmin = await persistActor(
        buildActor(UserRole.STATE_ADMIN, { stateId: site._id.toString() }),
      );
      const nationalAdmin = await persistActor(buildActor(UserRole.NATIONAL_ADMIN));

      const createResponse = await withActor(
        httpServer.post('/api/approvals').send({
          type: ApprovalType.INCIDENT,
          title: 'Emergency response approval',
          description: 'Requesting urgent remediation clearance.',
          referenceId: incident._id.toString(),
          isPriority: true,
        }),
        siteOfficer,
      ).expect(201);

      const approvalId = createResponse.body._id;
      expect(approvalId).toEqual(expect.any(String));

      const listResponse = await withActor(httpServer.get('/api/approvals'), siteOfficer).expect(200);
      expect(listResponse.body.approvals).toHaveLength(1);
      expect(listResponse.body.approvals[0]._id).toBe(approvalId);

      const detailResponse = await withActor(
        httpServer.get(`/api/approvals/${approvalId}`),
        siteOfficer,
      ).expect(200);
      expect(detailResponse.body._id).toBe(approvalId);

      await withActor(httpServer.get(`/api/approvals/${approvalId}`), secondOfficer).expect(403);

      const updateResponse = await withActor(
        httpServer.patch(`/api/approvals/${approvalId}`).send({
          title: 'Emergency stabilization approval',
          description: 'Updated summary for the same approval.',
          referenceId: incident._id.toString(),
          type: ApprovalType.INCIDENT,
          isPriority: false,
        }),
        siteOfficer,
      ).expect(200);

      expect(updateResponse.body.title).toBe('Emergency stabilization approval');
      expect(updateResponse.body.isPriority).toBe(false);

      const reviewResponse = await withActor(
        httpServer.patch(`/api/approvals/${approvalId}/review`).send({
          status: ApprovalStatus.APPROVED,
          reviewNotes: 'Approved for immediate execution.',
        }),
        stateAdmin,
      ).expect(200);

      expect(reviewResponse.body.status).toBe(ApprovalStatus.APPROVED);
      expect(reviewResponse.body.reviewNotes).toBe('Approved for immediate execution.');

      await withActor(
        httpServer.patch(`/api/approvals/${approvalId}`).send({
          title: 'Should fail after review',
          referenceId: incident._id.toString(),
          type: ApprovalType.INCIDENT,
        }),
        siteOfficer,
      ).expect(400);

      await withActor(httpServer.delete(`/api/approvals/${approvalId}`), nationalAdmin).expect(200);

      const archivedResponse = await withActor(
        httpServer.get('/api/approvals').query({ archived: true }),
        nationalAdmin,
      ).expect(200);
      expect(archivedResponse.body.approvals).toHaveLength(1);
      expect(archivedResponse.body.approvals[0]._id).toBe(approvalId);

      const restoreResponse = await withActor(
        httpServer.patch(`/api/approvals/${approvalId}/restore`),
        nationalAdmin,
      ).expect(200);

      expect(restoreResponse.body._id).toBe(approvalId);
    });
  });
});
