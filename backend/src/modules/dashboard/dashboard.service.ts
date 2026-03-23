import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Approval, ApprovalStatus, ApprovalType } from '@schemas/approval.schema';
import { Conservation, ConservationStatus } from '@schemas/conservation.schema';
import { Footfall } from '@schemas/footfall.schema';
import { Incident, IncidentSeverity, IncidentStatus } from '@schemas/incident.schema';
import { RiskLevel, Site } from '@schemas/site.schema';
import { DashboardQueryDto, DashboardScope } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Site.name) private siteModel: Model<Site>,
    @InjectModel(Incident.name) private incidentModel: Model<Incident>,
    @InjectModel(Conservation.name) private conservationModel: Model<Conservation>,
    @InjectModel(Approval.name) private approvalModel: Model<Approval>,
    @InjectModel(Footfall.name) private footfallModel: Model<Footfall>,
  ) {}

  async getOverview(query: DashboardQueryDto) {
    const scope = query.scope || DashboardScope.NATIONAL;
    const state = query.state?.trim();
    const siteId = query.siteId?.trim();

    const siteFilter = this.buildSiteFilter(scope, state, siteId);
    if (!siteFilter) {
      return this.buildEmptyOverview();
    }

    const sites = await this.siteModel.find(siteFilter).select('_id name state district').lean().exec();
    const siteIds = sites.map((site: any) => site._id);

    if (siteIds.length === 0) {
      return this.buildEmptyOverview();
    }

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
      resolvedApprovalsPromise.then((approvals) => this.getRecentActivity(siteIds, approvals)),
      resolvedApprovalsPromise,
    ]);

    const pendingApprovals = this.getPendingApprovals(resolvedApprovals);

    return {
      kpis: {
        ...operationalStats,
        pendingApprovals: pendingApprovals.length,
      },
      incidentsBySeverity,
      footfallTrend,
      recentActivity,
      regionSummary,
      criticalAlerts,
      pendingApprovals,
    };
  }

  private buildSiteFilter(
    scope: DashboardScope,
    state?: string,
    siteId?: string,
  ): Record<string, unknown> | null {
    if (scope === DashboardScope.STATE) {
      return state ? { state } : null;
    }

    if (scope === DashboardScope.SITE) {
      if (!siteId || !Types.ObjectId.isValid(siteId)) {
        return null;
      }

      return { _id: new Types.ObjectId(siteId) };
    }

    return {};
  }

  private buildEmptyOverview() {
    return {
      kpis: {
        totalSites: 0,
        highRiskSites: 0,
        activeIncidents: 0,
        pendingApprovals: 0,
        conservationOngoing: 0,
        visitorCapacity: 0,
      },
      incidentsBySeverity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
      },
      footfallTrend: [],
      recentActivity: [],
      regionSummary: [],
      criticalAlerts: [],
      pendingApprovals: [],
    };
  }

  private async getOperationalStats(siteFilter: Record<string, unknown>, siteIds: any[]) {
    const [siteStats, incidentStats, conservationStats] = await Promise.all([
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
      this.incidentModel.aggregate([
        { $match: { siteId: { $in: siteIds } } },
        {
          $facet: {
            active: [
              { $match: { status: { $ne: IncidentStatus.RESOLVED } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      this.conservationModel.aggregate([
        { $match: { siteId: { $in: siteIds } } },
        {
          $facet: {
            ongoing: [
              { $match: { status: ConservationStatus.ONGOING } },
              { $count: 'count' },
            ],
          },
        },
      ]),
    ]);

    return {
      totalSites: siteStats[0]?.total[0]?.count || 0,
      highRiskSites: siteStats[0]?.highRisk[0]?.count || 0,
      activeIncidents: incidentStats[0]?.active[0]?.count || 0,
      conservationOngoing: conservationStats[0]?.ongoing[0]?.count || 0,
      visitorCapacity: siteStats[0]?.totalCapacity[0]?.total || 0,
    };
  }

  private async getIncidentsBySeverity(siteIds: any[]) {
    const result = await this.incidentModel.aggregate([
      {
        $match: {
          siteId: { $in: siteIds },
          status: { $ne: IncidentStatus.RESOLVED },
        },
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    result.forEach((item: any) => {
      if (item._id && Object.prototype.hasOwnProperty.call(counts, item._id)) {
        counts[item._id as keyof typeof counts] = item.count;
      }
    });

    return counts;
  }

  private async getFootfallTrend(siteIds: any[]) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return this.footfallModel.aggregate([
      {
        $match: {
          siteId: { $in: siteIds },
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          visitors: { $sum: '$visitors' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id',
          visitors: 1,
        },
      },
    ]);
  }

  private async getCriticalAlerts(siteIds: any[]) {
    const alerts = await this.incidentModel
      .find({
        siteId: { $in: siteIds },
        severity: IncidentSeverity.HIGH,
        status: { $ne: IncidentStatus.RESOLVED },
      })
      .populate('siteId', 'name state district')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return alerts.map((alert: any) => ({
      id: alert._id.toString(),
      site: alert.siteId?.name || 'Unknown Site',
      type: this.formatLabel(alert.type),
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      daysOpen: this.calculateDaysOpen(alert.createdAt, alert.resolvedAt),
      canRespond: alert.status === IncidentStatus.OPEN,
    }));
  }

  private async getResolvedApprovals(siteIds: any[]) {
    const siteIdSet = new Set(siteIds.map((siteId) => siteId.toString()));
    const approvals = await this.approvalModel
      .find({})
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ isPriority: -1, createdAt: -1 })
      .lean()
      .exec();

    if (approvals.length === 0) {
      return [];
    }

    const incidentReferenceIds = approvals
      .filter((approval: any) => approval.type === ApprovalType.INCIDENT)
      .map((approval: any) => approval.referenceId);
    const conservationReferenceIds = approvals
      .filter((approval: any) => approval.type === ApprovalType.CONSERVATION)
      .map((approval: any) => approval.referenceId);
    const siteReferenceIds = approvals
      .filter(
        (approval: any) =>
          approval.type === ApprovalType.BUDGET || approval.type === ApprovalType.REPORT,
      )
      .map((approval: any) => approval.referenceId);

    const [incidentRefs, conservationRefs, siteRefs] = await Promise.all([
      incidentReferenceIds.length
        ? this.incidentModel.find({ _id: { $in: incidentReferenceIds } }).populate('siteId', 'name').lean().exec()
        : Promise.resolve([]),
      conservationReferenceIds.length
        ? this.conservationModel.find({ _id: { $in: conservationReferenceIds } }).populate('siteId', 'name').lean().exec()
        : Promise.resolve([]),
      siteReferenceIds.length
        ? this.siteModel.find({ _id: { $in: siteReferenceIds } }).select('name').lean().exec()
        : Promise.resolve([]),
    ]);

    const incidentMap = new Map(
      incidentRefs.map((incident: any) => [
        incident._id.toString(),
        {
          siteId: incident.siteId?._id?.toString(),
          siteName: incident.siteId?.name || 'Unknown Site',
        },
      ]),
    );
    const conservationMap = new Map(
      conservationRefs.map((project: any) => [
        project._id.toString(),
        {
          siteId: project.siteId?._id?.toString(),
          siteName: project.siteId?.name || 'Unknown Site',
        },
      ]),
    );
    const siteMap = new Map(
      siteRefs.map((site: any) => [site._id.toString(), { siteId: site._id.toString(), siteName: site.name }]),
    );

    return approvals
      .map((approval: any) => {
        const referenceId = approval.referenceId?.toString();
        const reference = this.resolveApprovalReference(
          approval.type,
          referenceId,
          incidentMap,
          conservationMap,
          siteMap,
        );

        if (!reference || !siteIdSet.has(reference.siteId)) {
          return null;
        }

        return {
          id: approval._id.toString(),
          type: approval.type,
          title: approval.title,
          description: approval.description || '',
          site: reference.siteName,
          submittedBy: approval.submittedBy?.name || 'Unknown User',
          priority: approval.isPriority ? 'High' : 'Normal',
          status: approval.status,
          createdAt: approval.createdAt,
          reviewNotes: approval.reviewNotes || '',
        };
      })
      .filter(
        (
          approval,
        ): approval is {
          id: string;
          type: ApprovalType;
          title: string;
          description: string;
          site: string;
          submittedBy: string;
          priority: 'High' | 'Normal';
          status: ApprovalStatus;
          createdAt: Date;
          reviewNotes: string;
        } => approval !== null,
      );
  }

  private resolveApprovalReference(
    approvalType: ApprovalType,
    referenceId: string,
    incidentMap: Map<string, { siteId?: string; siteName: string }>,
    conservationMap: Map<string, { siteId?: string; siteName: string }>,
    siteMap: Map<string, { siteId: string; siteName: string }>,
  ) {
    if (approvalType === ApprovalType.INCIDENT) {
      return incidentMap.get(referenceId);
    }

    if (approvalType === ApprovalType.CONSERVATION) {
      return conservationMap.get(referenceId);
    }

    return siteMap.get(referenceId);
  }

  private getPendingApprovals(
    approvals: Array<{
      id: string;
      type: ApprovalType;
      title: string;
      description: string;
      site: string;
      submittedBy: string;
      priority: 'High' | 'Normal';
      status: ApprovalStatus;
      createdAt: Date;
      reviewNotes: string;
    }>,
  ) {
    return approvals
      .filter((approval) => approval.status === ApprovalStatus.PENDING)
      .map((approval) => ({
        ...approval,
        type: this.formatLabel(approval.type),
      }));
  }

  private async getRecentActivity(siteIds: any[], approvals: any[]) {
    const [recentIncidents, recentConservation] = await Promise.all([
      this.incidentModel
        .find({ siteId: { $in: siteIds } })
        .populate('siteId', 'name')
        .populate('reportedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.conservationModel
        .find({ siteId: { $in: siteIds } })
        .populate('siteId', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    const activities = [
      ...recentIncidents.map((incident: any) => ({
        id: incident._id.toString(),
        type: 'incident',
        text: `${this.formatLabel(incident.type)} incident reported`,
        site: incident.siteId?.name || 'Unknown Site',
        user: incident.reportedBy?.name || 'Unknown User',
        timestamp: new Date(incident.createdAt).getTime(),
      })),
      ...recentConservation.map((project: any) => ({
        id: project._id.toString(),
        type: 'conservation',
        text: `${project.title} ${project.status.toLowerCase()}`,
        site: project.siteId?.name || 'Unknown Site',
        user: project.createdBy?.name || 'Unknown User',
        timestamp: new Date(project.updatedAt).getTime(),
      })),
      ...approvals.slice(0, 5).map((approval: any) => ({
        id: approval.id,
        type: 'approval',
        text: `${this.formatLabel(approval.type)} approval ${approval.status.toLowerCase()}`,
        site: approval.site,
        user: approval.submittedBy,
        timestamp: new Date(approval.createdAt).getTime(),
      })),
    ];

    return activities
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 10)
      .map((activity) => ({
        id: activity.id,
        type: activity.type,
        text: activity.text,
        site: activity.site,
        time: this.formatRelativeTime(activity.timestamp),
        user: activity.user,
      }));
  }

  private async getRegionSummary(scope: DashboardScope, state?: string) {
    if (scope === DashboardScope.SITE) {
      return [];
    }

    const matchStage = scope === DashboardScope.STATE && state ? { state } : {};

    return this.siteModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'incidents',
          localField: '_id',
          foreignField: 'siteId',
          as: 'incidents',
        },
      },
      {
        $group: {
          _id: scope === DashboardScope.NATIONAL ? '$state' : '$district',
          sites: { $sum: 1 },
          alerts: {
            $sum: {
              $size: {
                $filter: {
                  input: '$incidents',
                  as: 'incident',
                  cond: { $ne: ['$$incident.status', IncidentStatus.RESOLVED] },
                },
              },
            },
          },
          highRiskCount: {
            $sum: {
              $cond: [{ $eq: ['$riskLevel', RiskLevel.HIGH] }, 1, 0],
            },
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
              {
                $cond: [{ $gt: ['$alerts', 0] }, 'Attention', 'Stable'],
              },
            ],
          },
        },
      },
      { $sort: { alerts: -1, sites: -1 } },
      { $limit: 10 },
    ]);
  }

  private formatRelativeTime(timestamp: number) {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return `${diffDays}d ago`;
  }

  private calculateDaysOpen(createdAt: Date, resolvedAt?: Date) {
    const endTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const startTime = new Date(createdAt).getTime();
    return Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)));
  }

  private formatLabel(value: string) {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
