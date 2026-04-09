import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conservation } from '@schemas/conservation.schema';
import { Site } from '@schemas/site.schema';
import { UserRole } from '@schemas/user.schema';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { QueryConservationDto } from './dto/query-conservation.dto';

@Injectable()
export class ConservationService {
  constructor(
    @InjectModel(Conservation.name) private conservationModel: Model<Conservation>,
    @InjectModel(Site.name) private siteModel: Model<Site>,
  ) {}

  async create(createConservationDto: CreateConservationDto, actor: any): Promise<Conservation> {
    await this.ensureSiteInScope(createConservationDto.siteId, actor);

    const userId = this.getActorId(actor);
    const conservation = new this.conservationModel({
      ...createConservationDto,
      createdBy: new Types.ObjectId(userId),
    });

    return conservation.save();
  }

  async findAll(
    query: QueryConservationDto,
    actor: any,
  ): Promise<{ projects: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, siteId, status, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
    const scopedSiteIds = await this.getScopedSiteIds(actor);

    if (siteId) {
      await this.ensureSiteInScope(siteId, actor);
      filter.siteId = new Types.ObjectId(siteId);
    } else if (scopedSiteIds) {
      if (scopedSiteIds.length === 0) {
        return {
          projects: [],
          total: 0,
          page,
          limit,
        };
      }

      filter.siteId = { $in: scopedSiteIds };
    }

    if (status) {
      filter.status = status;
    }

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

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, actor: any): Promise<any> {
    const conservation = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('siteId', 'name state district')
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    if (!conservation) {
      throw new NotFoundException('Conservation project not found');
    }

    await this.ensureSiteInScope(this.extractSiteId(conservation.siteId), actor);

    return conservation;
  }

  async update(id: string, updateConservationDto: UpdateConservationDto, actor: any): Promise<Conservation> {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('siteId')
      .lean()
      .exec();

    if (!existing) {
      throw new NotFoundException('Conservation project not found');
    }

    await this.ensureSiteInScope(existing.siteId, actor);

    if (updateConservationDto.siteId) {
      await this.ensureSiteInScope(updateConservationDto.siteId, actor);
    }

    const conservation = await this.conservationModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, updateConservationDto, { new: true })
      .exec();

    if (!conservation) {
      throw new NotFoundException('Conservation project not found');
    }

    return conservation;
  }

  async remove(id: string, actor: any): Promise<void> {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('siteId')
      .lean()
      .exec();

    if (!existing) {
      throw new NotFoundException('Conservation project not found');
    }

    await this.ensureSiteInScope(existing.siteId, actor);

    const userId = this.getActorId(actor);
    const result = await this.conservationModel
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
      throw new NotFoundException('Conservation project not found');
    }
  }

  async restore(id: string, actor: any): Promise<Conservation> {
    const existing = await this.conservationModel
      .findOne({ _id: id, isDeleted: true })
      .select('siteId')
      .lean()
      .exec();

    if (!existing) {
      throw new NotFoundException('Archived conservation project not found');
    }

    await this.ensureSiteInScope(existing.siteId, actor);

    const conservation = await this.conservationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        {
          $set: { isDeleted: false },
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { new: true },
      )
      .exec();

    if (!conservation) {
      throw new NotFoundException('Archived conservation project not found');
    }

    return conservation;
  }

  private extractSiteId(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value === 'object' && value !== null && '_id' in value) {
      return this.extractSiteId((value as any)._id);
    }

    throw new BadRequestException('Conservation project is missing site context');
  }

  private toIdString(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
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

  private getActorId(actor: any): string {
    const actorId = this.toIdString(actor?._id) || this.toIdString(actor?.id);

    if (!actorId || !Types.ObjectId.isValid(actorId)) {
      throw new ForbiddenException('Unable to resolve authenticated user identity');
    }

    return actorId;
  }

  private getActorRole(actor: any): UserRole {
    const role = actor?.role as UserRole | undefined;

    if (!role) {
      throw new ForbiddenException('Authenticated user role is unavailable');
    }

    return role;
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

  private async getScopedSiteIds(actor: any): Promise<Types.ObjectId[] | null> {
    const role = this.getActorRole(actor);

    if (role === UserRole.NATIONAL_ADMIN) {
      return null;
    }

    if (role === UserRole.SITE_OFFICER) {
      const siteId = this.toIdString(actor?.siteId);

      if (!siteId || !Types.ObjectId.isValid(siteId)) {
        throw new ForbiddenException('Site officer must be assigned to a site');
      }

      return [new Types.ObjectId(siteId)];
    }

    const assignedState = await this.resolveActorState(actor);

    if (!assignedState) {
      throw new ForbiddenException('State admin must be assigned to a state or site');
    }

    const sites = await this.siteModel
      .find({ state: assignedState, isDeleted: { $ne: true } })
      .select('_id')
      .lean()
      .exec();

    return sites.map((site: any) => new Types.ObjectId(site._id));
  }

  private async ensureSiteInScope(siteId: string | Types.ObjectId, actor: any) {
    const normalizedSiteId = this.toIdString(siteId);

    if (!normalizedSiteId || !Types.ObjectId.isValid(normalizedSiteId)) {
      throw new BadRequestException('Invalid site id');
    }

    const site = await this.siteModel
      .findOne({ _id: normalizedSiteId, isDeleted: { $ne: true } })
      .select('_id state')
      .lean()
      .exec();

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    const role = this.getActorRole(actor);

    if (role === UserRole.NATIONAL_ADMIN) {
      return;
    }

    if (role === UserRole.SITE_OFFICER) {
      const actorSiteId = this.toIdString(actor?.siteId);

      if (!actorSiteId || actorSiteId !== normalizedSiteId) {
        throw new ForbiddenException('Site officer can only act within assigned site scope');
      }

      return;
    }

    const assignedState = await this.resolveActorState(actor);

    if (!assignedState) {
      throw new ForbiddenException('State admin must be assigned to a state or site');
    }

    if (site.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
      throw new ForbiddenException('State admin can only act within assigned state scope');
    }
  }
}
