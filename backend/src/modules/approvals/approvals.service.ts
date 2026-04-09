import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Approval, ApprovalStatus, ApprovalType } from '@schemas/approval.schema';
import { Incident } from '@schemas/incident.schema';
import { Conservation } from '@schemas/conservation.schema';
import { Site } from '@schemas/site.schema';
import { UserRole } from '@schemas/user.schema';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(Approval.name) private approvalModel: Model<Approval>,
    @InjectModel(Incident.name) private incidentModel: Model<Incident>,
    @InjectModel(Conservation.name) private conservationModel: Model<Conservation>,
    @InjectModel(Site.name) private siteModel: Model<Site>,
  ) {}

  async create(createApprovalDto: CreateApprovalDto, actor: any): Promise<Approval> {
    const userId = this.getActorId(actor);

    const referenceSiteId = await this.resolveReferenceSiteId(
      createApprovalDto.type,
      createApprovalDto.referenceId,
    );
    await this.ensureSiteInScope(referenceSiteId, actor);

    const approval = new this.approvalModel({
      ...createApprovalDto,
      submittedBy: new Types.ObjectId(userId),
    });

    return approval.save();
  }

  async findAll(
    query: QueryApprovalsDto,
    actor: any,
  ): Promise<{ approvals: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, type, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const allApprovals = await this.approvalModel
      .find(filter)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ isPriority: -1, createdAt: -1 })
      .lean()
      .exec();

    const visibleApprovals = await this.filterApprovalsByScope(allApprovals, actor);
    const approvals = visibleApprovals.slice(skip, skip + limit);
    const total = visibleApprovals.length;

    return {
      approvals,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, actor: any): Promise<any> {
    const approval = await this.approvalModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean()
      .exec();

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    await this.ensureApprovalReadAccess(approval, actor);

    return approval;
  }

  async update(id: string, updateApprovalDto: UpdateApprovalDto, actor: any): Promise<Approval> {
    const actorId = this.getActorId(actor);

    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    await this.ensureApprovalReadAccess(approval, actor);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending approvals can be edited');
    }

    const role = this.getActorRole(actor);
    const canEditAny = role === UserRole.NATIONAL_ADMIN || role === UserRole.STATE_ADMIN;
    const isSubmitter = approval.submittedBy?.toString() === actorId;

    if (!canEditAny && !isSubmitter) {
      throw new ForbiddenException('You can only edit approvals submitted by you');
    }

    const nextType = updateApprovalDto.type || approval.type;
    const nextReferenceId = updateApprovalDto.referenceId || approval.referenceId.toString();
    const nextReferenceSiteId = await this.resolveReferenceSiteId(nextType, nextReferenceId);
    await this.ensureSiteInScope(nextReferenceSiteId, actor);

    Object.assign(approval, updateApprovalDto);
    return approval.save();
  }

  async review(id: string, reviewApprovalDto: ReviewApprovalDto, reviewer: any): Promise<Approval> {
    const reviewerId = this.getActorId(reviewer);
    const reviewerRole = this.getActorRole(reviewer);

    if (reviewerRole === UserRole.SITE_OFFICER) {
      throw new ForbiddenException('Site officers are not authorized to review approvals');
    }

    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    await this.ensureApprovalReadAccess(approval, reviewer);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval has already been reviewed');
    }

    approval.status = reviewApprovalDto.status;
    approval.reviewNotes = reviewApprovalDto.reviewNotes;
    approval.reviewedBy = new Types.ObjectId(reviewerId);
    approval.reviewedAt = new Date();

    return approval.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.approvalModel
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
      throw new NotFoundException('Approval not found');
    }
  }

  async restore(id: string): Promise<Approval> {
    const approval = await this.approvalModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        {
          $set: { isDeleted: false },
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { new: true },
      )
      .exec();

    if (!approval) {
      throw new NotFoundException('Archived approval not found');
    }

    return approval;
  }

  // Helper method for dashboard: count pending approvals
  async countPending(): Promise<number> {
    return this.approvalModel.countDocuments({
      status: ApprovalStatus.PENDING,
      isDeleted: { $ne: true },
    });
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

  private async ensureSiteInScope(siteId: string, actor: any) {
    if (!Types.ObjectId.isValid(siteId)) {
      throw new BadRequestException('Invalid site reference');
    }

    const site = await this.siteModel
      .findOne({ _id: siteId, isDeleted: { $ne: true } })
      .select('_id state')
      .lean()
      .exec();

    if (!site) {
      throw new NotFoundException('Referenced site not found');
    }

    const role = this.getActorRole(actor);

    if (role === UserRole.NATIONAL_ADMIN) {
      return;
    }

    if (role === UserRole.SITE_OFFICER) {
      const actorSiteId = this.toIdString(actor?.siteId);

      if (!actorSiteId || actorSiteId !== siteId) {
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

  private async resolveReferenceSiteId(type: ApprovalType, referenceId: string): Promise<string> {
    if (!Types.ObjectId.isValid(referenceId)) {
      throw new BadRequestException('Invalid approval reference id');
    }

    if (type === ApprovalType.INCIDENT) {
      const incident = await this.incidentModel
        .findOne({ _id: referenceId, isDeleted: { $ne: true } })
        .select('siteId')
        .lean()
        .exec();

      if (!incident) {
        throw new NotFoundException('Referenced incident not found');
      }

      const siteId = this.toIdString(incident.siteId);
      if (!siteId) {
        throw new BadRequestException('Referenced incident is missing site mapping');
      }

      return siteId;
    }

    if (type === ApprovalType.CONSERVATION) {
      const project = await this.conservationModel
        .findOne({ _id: referenceId, isDeleted: { $ne: true } })
        .select('siteId')
        .lean()
        .exec();

      if (!project) {
        throw new NotFoundException('Referenced conservation project not found');
      }

      const siteId = this.toIdString(project.siteId);
      if (!siteId) {
        throw new BadRequestException('Referenced conservation project is missing site mapping');
      }

      return siteId;
    }

    const site = await this.siteModel
      .findOne({ _id: referenceId, isDeleted: { $ne: true } })
      .select('_id')
      .lean()
      .exec();

    if (!site) {
      throw new NotFoundException('Referenced site not found');
    }

    const siteId = this.toIdString(site._id);
    if (!siteId) {
      throw new BadRequestException('Referenced site id is invalid');
    }

    return siteId;
  }

  private async ensureApprovalReadAccess(approval: any, actor: any) {
    const role = this.getActorRole(actor);

    if (role === UserRole.NATIONAL_ADMIN) {
      return;
    }

    const actorId = this.getActorId(actor);
    const submittedById = this.toIdString(approval.submittedBy);

    if (role === UserRole.SITE_OFFICER && submittedById !== actorId) {
      throw new ForbiddenException('Site officers can only access their own approval requests');
    }

    const referenceId = this.toIdString(approval.referenceId);

    if (!referenceId) {
      throw new BadRequestException('Approval has an invalid reference id');
    }

    const referenceSiteId = await this.resolveReferenceSiteId(
      approval.type as ApprovalType,
      referenceId,
    );

    await this.ensureSiteInScope(referenceSiteId, actor);
  }

  private async filterApprovalsByScope(approvals: any[], actor: any): Promise<any[]> {
    const visible: any[] = [];

    for (const approval of approvals) {
      try {
        await this.ensureApprovalReadAccess(approval, actor);
        visible.push(approval);
      } catch (error) {
        if (!(error instanceof ForbiddenException)) {
          throw error;
        }
      }
    }

    return visible;
  }
}
