import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site } from '@schemas/site.schema';
import { UserRole } from '@schemas/user.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';
import { getActorRole, resolveActorState, toIdString } from '@common/scope/scope.utils';

@Injectable()
export class SitesService {
  constructor(@InjectModel(Site.name) private siteModel: Model<Site>) {}

  async create(dto: CreateSiteDto, actor: any): Promise<Site> {
    if (getActorRole(actor) === UserRole.STATE_ADMIN) {
      const assignedState = await resolveActorState(actor, this.siteModel);
      if (!assignedState) {
        throw new ForbiddenException('State admin must be assigned to a state or site');
      }
      if (dto.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
        throw new ForbiddenException('State admins can only create sites in their assigned state');
      }
    }

    const site = new this.siteModel({
      ...dto,
      coordinates: {
        type: 'Point',
        coordinates: [dto.coordinates.longitude, dto.coordinates.latitude],
      },
    });
    return site.save();
  }

  async findAll(query: QuerySitesDto, actor: any) {
    const { page = 1, limit = 10, state, riskLevel, protectionStatus, search, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
    if (state) filter.state = state;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (protectionStatus) filter.protectionStatus = protectionStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    await this.applyRoleScopeToFilter(filter, actor);

    const [sites, total] = await Promise.all([
      this.siteModel.find(filter).skip(skip).limit(limit).lean().exec(),
      this.siteModel.countDocuments(filter),
    ]);
    return { sites, total, page, limit };
  }

  async update(id: string, dto: UpdateSiteDto, actor: any): Promise<Site> {
    const existingSite = await this.siteModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();
    if (!existingSite) throw new NotFoundException('Site not found');

    if (getActorRole(actor) === UserRole.STATE_ADMIN) {
      const assignedState = await resolveActorState(actor, this.siteModel);
      if (!assignedState) {
        throw new ForbiddenException('State admin must be assigned to a state or site');
      }
      if (existingSite.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
        throw new ForbiddenException('State admins can only update sites in their assigned state');
      }
      if (dto.state && dto.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
        throw new ForbiddenException('State admins cannot move a site to another state');
      }
    }

    const updateData: any = { ...dto };
    if (dto.coordinates) {
      updateData.coordinates = {
        type: 'Point',
        coordinates: [dto.coordinates.longitude, dto.coordinates.latitude],
      };
    }

    const site = await this.siteModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, updateData, { new: true })
      .exec();
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.siteModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(userId),
        },
      )
      .exec();
    if (!result) throw new NotFoundException('Site not found');
  }

  async restore(id: string): Promise<Site> {
    const site = await this.siteModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
        { new: true },
      )
      .exec();
    if (!site) throw new NotFoundException('Archived site not found');
    return site;
  }

  private async applyRoleScopeToFilter(filter: Record<string, unknown>, actor: any) {
    const role = getActorRole(actor);
    if (role === UserRole.NATIONAL_ADMIN) return;

    if (role === UserRole.SITE_OFFICER) {
      const siteId = toIdString(actor?.siteId);
      if (!siteId || !Types.ObjectId.isValid(siteId)) {
        throw new ForbiddenException('Site officer must be assigned to a site');
      }
      const requestedSiteId = toIdString(filter._id);
      if (requestedSiteId && requestedSiteId !== siteId) {
        throw new ForbiddenException('Site officer can only access the assigned site');
      }
      filter._id = new Types.ObjectId(siteId);
      return;
    }

    const assignedState = await resolveActorState(actor, this.siteModel);
    if (!assignedState) {
      throw new ForbiddenException('State admin must be assigned to a state or site');
    }
    filter.state = assignedState;
  }
}
