import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site } from '@schemas/site.schema';
import { UserRole } from '@schemas/user.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Injectable()
export class SitesService {
  constructor(@InjectModel(Site.name) private siteModel: Model<Site>) {}

  async create(createSiteDto: CreateSiteDto, actor: any): Promise<Site> {
    const role = this.getActorRole(actor);

    if (role === UserRole.STATE_ADMIN) {
      const assignedState = await this.resolveActorState(actor);

      if (!assignedState) {
        throw new ForbiddenException('State admin must be assigned to a state or site');
      }

      if (createSiteDto.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
        throw new ForbiddenException('State admins can only create sites in their assigned state');
      }
    }

    const siteData = {
      ...createSiteDto,
      coordinates: {
        type: 'Point',
        coordinates: [createSiteDto.coordinates.longitude, createSiteDto.coordinates.latitude],
      },
    };

    const site = new this.siteModel(siteData);
    return site.save();
  }

  async findAll(
    query: QuerySitesDto,
    actor: any,
  ): Promise<{ sites: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, state, riskLevel, protectionStatus, search, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };

    if (state) {
      filter.state = state;
    }

    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }

    if (protectionStatus) {
      filter.protectionStatus = protectionStatus;
    }

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

    return {
      sites,
      total,
      page,
      limit,
    };
  }

  async findNearby(nearbyQuery: NearbyQueryDto, actor: any): Promise<any[]> {
    const { latitude, longitude, maxDistance } = nearbyQuery;

    const filter: any = {
      isDeleted: { $ne: true },
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    await this.applyRoleScopeToFilter(filter, actor);

    const sites = await this.siteModel
      .find(filter)
      .limit(20)
      .lean()
      .exec();

    return sites;
  }

  async findOne(id: string, actor: any): Promise<any> {
    const filter: any = { _id: id, isDeleted: { $ne: true } };
    await this.applyRoleScopeToFilter(filter, actor);

    const site = await this.siteModel.findOne(filter).lean().exec();

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto, actor: any): Promise<Site> {
    const role = this.getActorRole(actor);
    const existingSite = await this.siteModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (!existingSite) {
      throw new NotFoundException('Site not found');
    }

    if (role === UserRole.STATE_ADMIN) {
      const assignedState = await this.resolveActorState(actor);

      if (!assignedState) {
        throw new ForbiddenException('State admin must be assigned to a state or site');
      }

      if (existingSite.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
        throw new ForbiddenException('State admins can only update sites in their assigned state');
      }

      if (
        updateSiteDto.state &&
        updateSiteDto.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()
      ) {
        throw new ForbiddenException('State admins cannot move a site to another state');
      }
    }

    let updateData: any = { ...updateSiteDto };

    if (updateSiteDto.coordinates) {
      updateData.coordinates = {
        type: 'Point',
        coordinates: [updateSiteDto.coordinates.longitude, updateSiteDto.coordinates.latitude],
      };
    }

    const site = await this.siteModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, updateData, { new: true })
      .exec();

    if (!site) {
      throw new NotFoundException('Site not found');
    }

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

    if (!result) {
      throw new NotFoundException('Site not found');
    }
  }

  async restore(id: string): Promise<Site> {
    const site = await this.siteModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        {
          $set: { isDeleted: false },
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { new: true },
      )
      .exec();

    if (!site) {
      throw new NotFoundException('Archived site not found');
    }

    return site;
  }

  async getStatistics(id: string, actor: any): Promise<any> {
    const site = await this.findOne(id, actor);

    // Get related counts using aggregation
    const stats = await this.siteModel.aggregate([
      { $match: { _id: site._id, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'incidents',
          localField: '_id',
          foreignField: 'siteId',
          as: 'incidents',
        },
      },
      {
        $lookup: {
          from: 'conservations',
          localField: '_id',
          foreignField: 'siteId',
          as: 'conservations',
        },
      },
      {
        $project: {
          name: 1,
          state: 1,
          district: 1,
          riskLevel: 1,
          protectionStatus: 1,
          visitorCapacity: 1,
          lastInspectionDate: 1,
          totalIncidents: {
            $size: {
              $filter: {
                input: '$incidents',
                as: 'incident',
                cond: { $ne: ['$$incident.isDeleted', true] },
              },
            },
          },
          activeIncidents: {
            $size: {
              $filter: {
                input: '$incidents',
                as: 'incident',
                cond: {
                  $and: [
                    { $eq: ['$$incident.status', 'OPEN'] },
                    { $ne: ['$$incident.isDeleted', true] },
                  ],
                },
              },
            },
          },
          totalConservationProjects: {
            $size: {
              $filter: {
                input: '$conservations',
                as: 'conservation',
                cond: { $ne: ['$$conservation.isDeleted', true] },
              },
            },
          },
          ongoingConservation: {
            $size: {
              $filter: {
                input: '$conservations',
                as: 'conservation',
                cond: {
                  $and: [
                    { $eq: ['$$conservation.status', 'ONGOING'] },
                    { $ne: ['$$conservation.isDeleted', true] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    return stats[0] || {};
  }

  private getActorRole(actor: any): UserRole {
    const role = actor?.role as UserRole | undefined;

    if (!role) {
      throw new ForbiddenException('Authenticated user role is unavailable');
    }

    return role;
  }

  private toIdString(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null && '_id' in value) {
      return this.toIdString((value as any)._id);
    }

    if (typeof value === 'object' && value !== null && 'toString' in value) {
      const asString = (value as { toString: () => string }).toString();
      return asString && asString !== '[object Object]' ? asString : null;
    }

    return null;
  }

  private async resolveActorState(actor: any): Promise<string | null> {
    const candidateIds = [this.toIdString(actor?.stateId), this.toIdString(actor?.siteId)].filter(
      (candidate): candidate is string => !!candidate,
    );

    for (const candidateId of candidateIds) {
      if (!Types.ObjectId.isValid(candidateId)) {
        continue;
      }

      const site = await this.siteModel
        .findById(candidateId)
        .select('state')
        .lean()
        .exec();

      if (site?.state) {
        return site.state;
      }
    }

    return null;
  }

  private async applyRoleScopeToFilter(filter: Record<string, unknown>, actor: any) {
    const role = this.getActorRole(actor);

    if (role === UserRole.NATIONAL_ADMIN) {
      return;
    }

    if (role === UserRole.SITE_OFFICER) {
      const siteId = this.toIdString(actor?.siteId);

      if (!siteId || !Types.ObjectId.isValid(siteId)) {
        throw new ForbiddenException('Site officer must be assigned to a site');
      }

      filter._id = new Types.ObjectId(siteId);
      return;
    }

    const assignedState = await this.resolveActorState(actor);

    if (!assignedState) {
      throw new ForbiddenException('State admin must be assigned to a state or site');
    }

    filter.state = assignedState;
  }
}
