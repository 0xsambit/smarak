import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Incident, IncidentStatus } from '../../schemas/incident.schema.js';
import { Site } from '../../schemas/site.schema.js';
import {
  ensureSiteInScope,
  getActorId,
  getScopedSiteIds,
} from '../../common/scope/scope.utils.js';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) incidentModel,
    @InjectModel(Site.name) siteModel,
  ) {
    this.incidentModel = incidentModel;
    this.siteModel = siteModel;
  }

  async create(dto, actor) {
    await ensureSiteInScope(dto.siteId, actor, this.siteModel);
    const incident = new this.incidentModel({
      ...dto,
      reportedBy: new Types.ObjectId(getActorId(actor)),
    });
    return incident.save();
  }

  async findAll(query, actor) {
    const { page = 1, limit = 10, siteId, status, severity, archived } = query;
    const skip = (page - 1) * limit;

    const filter = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
    const scopedSiteIds = await getScopedSiteIds(actor, this.siteModel);

    if (siteId) {
      await ensureSiteInScope(siteId, actor, this.siteModel);
      filter.siteId = new Types.ObjectId(siteId);
    } else if (scopedSiteIds) {
      if (scopedSiteIds.length === 0) return { incidents: [], total: 0, page, limit };
      filter.siteId = { $in: scopedSiteIds };
    }

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const [incidents, total] = await Promise.all([
      this.incidentModel
        .find(filter)
        .populate('siteId', 'name state district')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.incidentModel.countDocuments(filter),
    ]);

    return { incidents, total, page, limit };
  }

  async updateStatus(id, dto, actor) {
    const incident = await this.incidentModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!incident) throw new NotFoundException('Incident not found');

    await ensureSiteInScope(incident.siteId, actor, this.siteModel);
    if (dto.siteId) await ensureSiteInScope(dto.siteId, actor, this.siteModel);

    if (dto.status) {
      if (incident.status === IncidentStatus.RESOLVED) {
        throw new BadRequestException('Cannot update a resolved incident');
      }
      if (dto.status === IncidentStatus.RESOLVED) incident.resolvedAt = new Date();
    }

    Object.assign(incident, dto);
    return incident.save();
  }

  async remove(id, actor) {
    const existing = await this.incidentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('siteId')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Incident not found');

    await ensureSiteInScope(existing.siteId, actor, this.siteModel);

    const result = await this.incidentModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(getActorId(actor)),
        },
      )
      .exec();

    if (!result) throw new NotFoundException('Incident not found');
  }

  async restore(id, actor) {
    const existing = await this.incidentModel
      .findOne({ _id: id, isDeleted: true })
      .select('siteId')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Archived incident not found');

    await ensureSiteInScope(existing.siteId, actor, this.siteModel);

    const incident = await this.incidentModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
        { new: true },
      )
      .exec();
    if (!incident) throw new NotFoundException('Archived incident not found');
    return incident;
  }
}
