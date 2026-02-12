import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site, RiskLevel } from '@schemas/site.schema';
import { Incident, IncidentStatus, IncidentSeverity } from '@schemas/incident.schema';
import { Conservation, ConservationStatus } from '@schemas/conservation.schema';
import { Approval, ApprovalStatus } from '@schemas/approval.schema';
import { Footfall } from '@schemas/footfall.schema';
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
    const { scope, state, siteId } = query;

    // Build filter based on scope
    const siteFilter: any = {};
    if (scope === DashboardScope.STATE && state) {
      siteFilter.state = state;
    } else if (scope === DashboardScope.SITE && siteId) {
      siteFilter._id = new Types.ObjectId(siteId);
    }

    // Get site IDs for filtering
    const sites = await this.siteModel.find(siteFilter).select('_id').lean();
    const siteIds = sites.map((s) => s._id);

    // Run aggregations in parallel
    const [
      kpis,
      incidentsBySeverity,
      footfallTrend,
      recentActivity,
      regionSummary,
    ] = await Promise.all([
      this.getKPIs(siteFilter, siteIds),
      this.getIncidentsBySeverity(siteIds),
      this.getFootfallTrend(siteIds),
      this.getRecentActivity(siteIds),
      this.getRegionSummary(scope, state),
    ]);

    return {
      kpis,
      incidentsBySeverity,
      footfallTrend,
      recentActivity,
      regionSummary,
    };
  }

  private async getKPIs(siteFilter: any, siteIds: any[]) {
    // Use aggregation pipeline for efficient counting
    const [siteStats, incidentStats, conservationStats, approvalStats] = await Promise.all([
      this.siteModel.aggregate([
        { $match: siteFilter },
        {
          $facet: {
            total: [{ $count: 'count' }],
            highRisk: [
              { $match: { riskLevel: RiskLevel.HIGH } },
              { $count: 'count' },
            ],
            totalCapacity: [
              { $group: { _id: null, total: { $sum: '$visitorCapacity' } } },
            ],
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
      this.approvalModel.aggregate([
        {
          $facet: {
            pending: [
              { $match: { status: ApprovalStatus.PENDING } },
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
      pendingApprovals: approvalStats[0]?.pending[0]?.count || 0,
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

    const severityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    result.forEach((item: any) => {
      if (item._id && severityCounts.hasOwnProperty(item._id)) {
        severityCounts[item._id as keyof typeof severityCounts] = item.count;
      }
    });

    return severityCounts;
  }

  private async getFootfallTrend(siteIds: any[]) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.footfallModel.aggregate([
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

    return result;
  }

  private async getRecentActivity(siteIds: any[]) {
    // Get recent incidents
    const recentIncidents = await this.incidentModel
      .find({ siteId: { $in: siteIds } })
      .populate('siteId', 'name')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent conservation updates
    const recentConservation = await this.conservationModel
      .find({ siteId: { $in: siteIds } })
      .populate('siteId', 'name')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    // Get recent approvals
    const recentApprovals = await this.approvalModel
      .find({})
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Combine and format activities
    const activities = [
      ...recentIncidents.map((incident: any) => ({
        id: incident._id.toString(),
        type: 'incident',
        text: `${incident.type} incident reported`,
        site: incident.siteId?.name || 'Unknown Site',
        time: this.formatRelativeTime(incident.createdAt),
        user: incident.reportedBy?.name || 'Unknown User',
      })),
      ...recentConservation.map((conservation: any) => ({
        id: conservation._id.toString(),
        type: 'conservation',
        text: `Conservation project ${conservation.status.toLowerCase()}`,
        site: conservation.siteId?.name || 'Unknown Site',
        time: this.formatRelativeTime(conservation.updatedAt),
        user: conservation.createdBy?.name || 'System',
      })),
      ...recentApprovals.map((approval: any) => ({
        id: approval._id.toString(),
        type: 'approval',
        text: `${approval.type} approval ${approval.status.toLowerCase()}`,
        site: 'System',
        time: this.formatRelativeTime(approval.createdAt),
        user: approval.submittedBy?.name || 'Unknown User',
      })),
    ];

    // Sort by time and return top 10
    return activities
      .sort((a, b) => this.parseRelativeTime(a.time) - this.parseRelativeTime(b.time))
      .slice(0, 10);
  }

  private async getRegionSummary(scope: DashboardScope | undefined, state?: string) {
    if (scope === DashboardScope.SITE) {
      return [];
    }

    let matchStage: any = {};
    if (scope === DashboardScope.STATE && state) {
      matchStage = { state };
    }

    const result = await this.siteModel.aggregate([
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
                $cond: [{ $gt: ['$alerts', 3] }, 'Attention', 'Stable'],
              },
            ],
          },
        },
      },
      { $sort: { alerts: -1 } },
      { $limit: 10 },
    ]);

    return result;
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  private parseRelativeTime(timeStr: string): number {
    const match = timeStr.match(/(\d+)([mhd])/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'm') return value;
    if (unit === 'h') return value * 60;
    if (unit === 'd') return value * 1440;
    return 0;
  }
}
