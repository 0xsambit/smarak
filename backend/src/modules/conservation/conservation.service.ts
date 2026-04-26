import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conservation } from '@schemas/conservation.schema';
import { Site } from '@schemas/site.schema';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { QueryConservationDto } from './dto/query-conservation.dto';
import {
  ensureSiteInScope,
  getActorId,
  getScopedSiteIds,
} from '@common/scope/scope.utils';

@Injectable()
export class ConservationService {
  constructor(
    @InjectModel(Conservation.name) private conservationModel: Model<Conservation>,
    @InjectModel(Site.name) private siteModel: Model<Site>,
  ) {}

  async create(dto: CreateConservationDto, actor: any): Promise<Conservation> {
    await ensureSiteInScope(dto.siteId, actor, this.siteModel);
    const conservation = new this.conservationModel({
      ...dto,
      createdBy: new Types.ObjectId(getActorId(actor)),
    });
    return conservation.save();
  }

  async findAll(query: QueryConservationDto, actor: any) {
    const { page = 1, limit = 10, siteId, status, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
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

  async update(id: string, dto: UpdateConservationDto, actor: any): Promise<Conservation> {
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

  async remove(id: string, actor: any): Promise<void> {
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

  async restore(id: string, actor: any): Promise<Conservation> {
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
