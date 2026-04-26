import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Approval, ApprovalStatus, ApprovalType } from '../../schemas/approval.schema.js';
import { Conservation } from '../../schemas/conservation.schema.js';
import { Footfall } from '../../schemas/footfall.schema.js';
import { Incident, IncidentSeverity, IncidentStatus } from '../../schemas/incident.schema.js';
import { RiskLevel, Site } from '../../schemas/site.schema.js';
import { UserRole } from '../../schemas/user.schema.js';
import { DashboardScope } from './dto/dashboard-query.dto.js';
import { formatLabel, resolveActorState, toIdString } from '../../common/scope/scope.utils.js';

const EMPTY_OVERVIEW = {
  kpis: {
    totalSites: 0,
    highRiskSites: 0,
    activeIncidents: 0,
    pendingApprovals: 0,
    conservationOngoing: 0,
    visitorCapacity: 0,
  },
  incidentsBySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0 },
  footfallTrend: [],
  recentActivity: [],
  regionSummary: [],
  criticalAlerts: [],
  pendingApprovals: [],
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Site.name) siteModel,
    @InjectModel(Incident.name) incidentModel,
    @InjectModel(Conservation.name) conservationModel,
    @InjectModel(Approval.name) approvalModel,
    @InjectModel(Footfall.name) footfallModel,
  ) {
    this.siteModel = siteModel;
    this.incidentModel = incidentModel;
    this.conservationModel = conservationModel;
    this.approvalModel = approvalModel;
    this.footfallModel = footfallModel;
  }

  async getOverview(query, user) {
    const scopedQuery = await this.resolveScopedQuery(query, user);
    const scope = scopedQuery.scope || DashboardScope.NATIONAL;
    const state = scopedQuery.state?.trim();
    const siteId = scopedQuery.siteId?.trim();

    const siteFilter = this.buildSiteFilter(scope, state, siteId);
    if (!siteFilter) return EMPTY_OVERVIEW;

    const sites = await this.siteModel.find(siteFilter).select('_id').lean().exec();
    const siteIds = sites.map((s) => s._id);
    if (siteIds.length === 0) return EMPTY_OVERVIEW;

    const resolvedApprovalsPromise = this.getResolvedApprovals(siteIds);
    const [
      operationalStats,
      incidentsBySeverity,
      footfallTrend,
      regionSummary,
      criticalAlerts,
      recentActivity,
      resolvedApprovals,
    ] = await Promise.all([
      this.getOperationalStats(siteFilter, siteIds),
      this.getIncidentsBySeverity(siteIds),
      this.getFootfallTrend(siteIds),
      this.getRegionSummary(scope, state),
      this.getCriticalAlerts(siteIds),
      resolvedApprovalsPromise.then((a) => this.getRecentActivity(siteIds, a)),
      resolvedApprovalsPromise,
    ]);

    return {
      kpis: { ...operationalStats, pendingApprovals: resolvedApprovals.length },
      incidentsBySeverity,
      footfallTrend,
      recentActivity,
      regionSummary,
      criticalAlerts,
      pendingApprovals: this.getPendingApprovals(resolvedApprovals),
    };
  }

  async resolveScopedQuery(query, user) {
    const role = user?.role;
    if (!role) throw new ForbiddenException('Authenticated user role is unavailable');
    if (role === UserRole.NATIONAL_ADMIN) return query;

    if (role === UserRole.SITE_OFFICER) {
      const siteId = toIdString(user?.siteId);
      if (!siteId || !Types.ObjectId.isValid(siteId)) {
        throw new ForbiddenException('Site officer must be assigned to a site');
      }
      return { scope: DashboardScope.SITE, siteId };
    }

    const state = await resolveActorState(user, this.siteModel);
    if (!state) throw new ForbiddenException('State admin must be assigned to a state or site');
    return { scope: DashboardScope.STATE, state };
  }

  buildSiteFilter(scope, state, siteId) {
    const base = { isDeleted: { $ne: true } };
    if (scope === DashboardScope.STATE) return state ? { ...base, state } : null;
    if (scope === DashboardScope.SITE) {
      if (!siteId || !Types.ObjectId.isValid(siteId)) return null;
      return { ...base, _id: new Types.ObjectId(siteId) };
    }
    return base;
  }

  async getOperationalStats(siteFilter, siteIds) {
    const incidentFilter = { siteId: { $in: siteIds }, isDeleted: { $ne: true } };
    const [siteStats, incidentTotal, conservationTotal] = await Promise.all([
      this.siteModel.aggregate([
        { $match: siteFilter },
        {
          $facet: {
            total: [{ $count: 'count' }],
            highRisk: [{ $match: { riskLevel: RiskLevel.HIGH } }, { $count: 'count' }],
            totalCapacity: [{ $group: { _id: null, total: { $sum: '$visitorCapacity' } } }],
          },
        },
      ]),
      this.incidentModel.countDocuments(incidentFilter),
      this.conservationModel.countDocuments(incidentFilter),
    ]);

    return {
      totalSites: siteStats[0]?.total[0]?.count || 0,
      highRiskSites: siteStats[0]?.highRisk[0]?.count || 0,
      activeIncidents: incidentTotal,
      conservationOngoing: conservationTotal,
      visitorCapacity: siteStats[0]?.totalCapacity[0]?.total || 0,
    };
  }

  async getIncidentsBySeverity(siteIds) {
    const result = await this.incidentModel.aggregate([
      {
        $match: {
          siteId: { $in: siteIds },
          isDeleted: { $ne: true },
          status: { $ne: IncidentStatus.RESOLVED },
        },
      },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const item of result) {
      if (item._id && item._id in counts) counts[item._id] = item.count;
    }
    return counts;
  }

  async getFootfallTrend(siteIds) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return this.footfallModel.aggregate([
      { $match: { siteId: { $in: siteIds }, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          visitors: { $sum: '$visitors' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', visitors: 1 } },
    ]);
  }

  async getCriticalAlerts(siteIds) {
    const alerts = await this.incidentModel
      .find({
        siteId: { $in: siteIds },
        isDeleted: { $ne: true },
        severity: IncidentSeverity.HIGH,
        status: { $ne: IncidentStatus.RESOLVED },
      })
      .populate('siteId', 'name state district')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return alerts.map((a) => ({
      id: a._id.toString(),
      site: a.siteId?.name || 'Unknown Site',
      type: formatLabel(a.type),
      description: a.description,
      severity: a.severity,
      status: a.status,
      daysOpen: this.calculateDaysOpen(a.createdAt, a.resolvedAt),
      canRespond: a.status === IncidentStatus.OPEN,
    }));
  }

  async getResolvedApprovals(siteIds) {
    const siteIdSet = new Set(siteIds.map((id) => id.toString()));
    const approvals = await this.approvalModel
      .find({ isDeleted: { $ne: true } })
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ isPriority: -1, createdAt: -1 })
      .lean()
      .exec();
    if (approvals.length === 0) return [];

    const refIds = (predicate) => approvals.filter(predicate).map((a) => a.referenceId);
    const incidentIds = refIds((a) => a.type === ApprovalType.INCIDENT);
    const conservationIds = refIds((a) => a.type === ApprovalType.CONSERVATION);
    const siteRefIds = refIds(
      (a) => a.type === ApprovalType.BUDGET || a.type === ApprovalType.REPORT,
    );

    const [incidentRefs, conservationRefs, siteRefs] = await Promise.all([
      incidentIds.length
        ? this.incidentModel
            .find({ _id: { $in: incidentIds }, isDeleted: { $ne: true } })
            .populate('siteId', 'name')
            .lean()
            .exec()
        : [],
      conservationIds.length
        ? this.conservationModel
            .find({ _id: { $in: conservationIds }, isDeleted: { $ne: true } })
            .populate('siteId', 'name')
            .lean()
            .exec()
        : [],
      siteRefIds.length
        ? this.siteModel
            .find({ _id: { $in: siteRefIds }, isDeleted: { $ne: true } })
            .select('name')
            .lean()
            .exec()
        : [],
    ]);

    const refToSite = new Map();
    for (const i of incidentRefs) {
      refToSite.set(i._id.toString(), {
        siteId: i.siteId?._id?.toString(),
        siteName: i.siteId?.name || 'Unknown Site',
      });
    }
    for (const p of conservationRefs) {
      refToSite.set(p._id.toString(), {
        siteId: p.siteId?._id?.toString(),
        siteName: p.siteId?.name || 'Unknown Site',
      });
    }
    for (const s of siteRefs) {
      refToSite.set(s._id.toString(), { siteId: s._id.toString(), siteName: s.name });
    }

    return approvals
      .map((a) => {
        const ref = refToSite.get(a.referenceId?.toString());
        if (!ref || !ref.siteId || !siteIdSet.has(ref.siteId)) return null;
        return {
          id: a._id.toString(),
          type: a.type,
          title: a.title,
          description: a.description || '',
          site: ref.siteName,
          submittedBy: a.submittedBy?.name || 'Unknown User',
          priority: a.isPriority ? 'High' : 'Normal',
          status: a.status,
          createdAt: a.createdAt,
          reviewNotes: a.reviewNotes || '',
        };
      })
      .filter((a) => a !== null);
  }

  getPendingApprovals(approvals) {
    return approvals
      .filter((a) => a.status === ApprovalStatus.PENDING)
      .map((a) => ({ ...a, type: formatLabel(a.type) }));
  }

  async getRecentActivity(siteIds, approvals) {
    const [recentIncidents, recentConservation] = await Promise.all([
      this.incidentModel
        .find({ siteId: { $in: siteIds }, isDeleted: { $ne: true } })
        .populate('siteId', 'name')
        .populate('reportedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.conservationModel
        .find({ siteId: { $in: siteIds }, isDeleted: { $ne: true } })
        .populate('siteId', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    const activities = [
      ...recentIncidents.map((i) => ({
        id: i._id.toString(),
        type: 'incident',
        text: `${formatLabel(i.type)} incident reported`,
        site: i.siteId?.name || 'Unknown Site',
        user: i.reportedBy?.name || 'Unknown User',
        timestamp: new Date(i.createdAt).getTime(),
      })),
      ...recentConservation.map((p) => ({
        id: p._id.toString(),
        type: 'conservation',
        text: `${p.title} ${p.status.toLowerCase()}`,
        site: p.siteId?.name || 'Unknown Site',
        user: p.createdBy?.name || 'Unknown User',
        timestamp: new Date(p.updatedAt).getTime(),
      })),
      ...approvals.slice(0, 5).map((a) => ({
        id: a.id,
        type: 'approval',
        text: `${formatLabel(a.type)} approval ${a.status.toLowerCase()}`,
        site: a.site,
        user: a.submittedBy,
        timestamp: new Date(a.createdAt).getTime(),
      })),
    ];

    return activities
      .sort((l, r) => r.timestamp - l.timestamp)
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        type: a.type,
        text: a.text,
        site: a.site,
        time: this.formatRelativeTime(a.timestamp),
        user: a.user,
      }));
  }

  async getRegionSummary(scope, state) {
    if (scope === DashboardScope.SITE) return [];
    const matchStage = {
      isDeleted: { $ne: true },
      ...(scope === DashboardScope.STATE && state ? { state } : {}),
    };
    return this.siteModel.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'incidents', localField: '_id', foreignField: 'siteId', as: 'incidents' } },
      {
        $group: {
          _id: scope === DashboardScope.NATIONAL ? '$state' : '$district',
          sites: { $sum: 1 },
          alerts: {
            $sum: {
              $size: {
                $filter: {
                  input: '$incidents',
                  as: 'i',
                  cond: {
                    $and: [
                      { $ne: ['$$i.status', IncidentStatus.RESOLVED] },
                      { $ne: ['$$i.isDeleted', true] },
                    ],
                  },
                },
              },
            },
          },
          highRiskCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', RiskLevel.HIGH] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          sites: 1,
          alerts: 1,
          status: {
            $cond: [
              { $gt: ['$highRiskCount', 0] },
              'Critical',
              { $cond: [{ $gt: ['$alerts', 0] }, 'Attention', 'Stable'] },
            ],
          },
        },
      },
      { $sort: { alerts: -1, sites: -1 } },
      { $limit: 10 },
    ]);
  }

  formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  calculateDaysOpen(createdAt, resolvedAt) {
    const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const start = new Date(createdAt).getTime();
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }
}
