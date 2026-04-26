import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Conservation } from '../../schemas/conservation.schema.js';
import { Site } from '../../schemas/site.schema.js';
import {
  ensureSiteInScope,
  getActorId,
  getScopedSiteIds,
} from '../../common/scope/scope.utils.js';

@Injectable()
export class ConservationService {
  constructor(
    @InjectModel(Conservation.name) conservationModel,
    @InjectModel(Site.name) siteModel,
  ) {
    this.conservationModel = conservationModel;
    this.siteModel = siteModel;
  }

  async create(dto, actor) {
    await ensureSiteInScope(dto.siteId, actor, this.siteModel);
    const conservation = new this.conservationModel({
      ...dto,
      createdBy: new Types.ObjectId(getActorId(actor)),
    });
    return conservation.save();
  }

  async findAll(query, actor) {
    const { page = 1, limit = 10, siteId, status, archived } = query;
    const skip = (page - 1) * limit;

    const filter = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
    const scopedSiteIds = await getScopedSiteIds(actor, this.siteModel);

    if (siteId) {
      await ensureSiteInScope(siteId, actor, this.siteModel);
      filter.siteId = new Types.ObjectId(siteId);
    } else if (scopedSiteIds) {
      if (scopedSiteIds.length === 0) return { projects: [], total: 0, page, limit };
      filter.siteId = { $in: scopedSiteIds };
    }

    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
      this.conservationModel
        .find(filter)
        .populate('siteId', 'name state district')
        .populate('createdBy', 'name email')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.conservationModel.countDocuments(filter),
    ]);

    return { projects, total, page, limit };
  }

  async update(id, dto, actor) {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('siteId')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Conservation project not found');

    await ensureSiteInScope(existing.siteId, actor, this.siteModel);
    if (dto.siteId) await ensureSiteInScope(dto.siteId, actor, this.siteModel);

    const conservation = await this.conservationModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, dto, { new: true })
      .exec();
    if (!conservation) throw new NotFoundException('Conservation project not found');
    return conservation;
  }

  async remove(id, actor) {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('siteId')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Conservation project not found');

    await ensureSiteInScope(existing.siteId, actor, this.siteModel);

    const result = await this.conservationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(getActorId(actor)),
        },
      )
      .exec();
    if (!result) throw new NotFoundException('Conservation project not found');
  }

  async restore(id, actor) {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: true })
      .select('siteId')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Archived conservation project not found');

    await ensureSiteInScope(existing.siteId, actor, this.siteModel);

    const conservation = await this.conservationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
        { new: true },
      )
      .exec();
    if (!conservation) throw new NotFoundException('Archived conservation project not found');
    return conservation;
  }
}
