import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import {
  ensureSiteInScope,
  getActorId,
  getActorRole,
  toIdString,
} from '@common/scope/scope.utils';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(Approval.name) private approvalModel: Model<Approval>,
    @InjectModel(Incident.name) private incidentModel: Model<Incident>,
    @InjectModel(Conservation.name) private conservationModel: Model<Conservation>,
    @InjectModel(Site.name) private siteModel: Model<Site>,
  ) {}

  async create(dto: CreateApprovalDto, actor: any): Promise<Approval> {
    const referenceSiteId = await this.resolveReferenceSiteId(dto.type, dto.referenceId);
    await ensureSiteInScope(referenceSiteId, actor, this.siteModel);

    const approval = new this.approvalModel({
      ...dto,
      submittedBy: new Types.ObjectId(getActorId(actor)),
    });
    return approval.save();
  }

  async findAll(query: QueryApprovalsDto, actor: any) {
    const { page = 1, limit = 10, status, type, archived } = query;
    const skip = (page - 1) * limit;

    const filter: any = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const allApprovals = await this.approvalModel
      .find(filter)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ isPriority: -1, createdAt: -1 })
      .lean()
      .exec();

    const visibleApprovals = await this.filterApprovalsByScope(allApprovals, actor);
    return {
      approvals: visibleApprovals.slice(skip, skip + limit),
      total: visibleApprovals.length,
      page,
      limit,
    };
  }

  async update(id: string, dto: UpdateApprovalDto, actor: any): Promise<Approval> {
    const actorId = getActorId(actor);
    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!approval) throw new NotFoundException('Approval not found');

    await this.ensureApprovalReadAccess(approval, actor);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending approvals can be edited');
    }

    const role = getActorRole(actor);
    const canEditAny = role === UserRole.NATIONAL_ADMIN || role === UserRole.STATE_ADMIN;
    const isSubmitter = approval.submittedBy?.toString() === actorId;
    if (!canEditAny && !isSubmitter) {
      throw new ForbiddenException('You can only edit approvals submitted by you');
    }

    const nextType = dto.type || approval.type;
    const nextReferenceId = dto.referenceId || approval.referenceId.toString();
    const nextReferenceSiteId = await this.resolveReferenceSiteId(nextType, nextReferenceId);
    await ensureSiteInScope(nextReferenceSiteId, actor, this.siteModel);

    Object.assign(approval, dto);
    return approval.save();
  }

  async review(id: string, dto: ReviewApprovalDto, reviewer: any): Promise<Approval> {
    if (getActorRole(reviewer) === UserRole.SITE_OFFICER) {
      throw new ForbiddenException('Site officers are not authorized to review approvals');
    }

    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!approval) throw new NotFoundException('Approval not found');

    await this.ensureApprovalReadAccess(approval, reviewer);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval has already been reviewed');
    }

    approval.status = dto.status;
    approval.reviewNotes = dto.reviewNotes;
    approval.reviewedBy = new Types.ObjectId(getActorId(reviewer));
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
    if (!result) throw new NotFoundException('Approval not found');
  }

  async restore(id: string): Promise<Approval> {
    const approval = await this.approvalModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
        { new: true },
      )
      .exec();
    if (!approval) throw new NotFoundException('Archived approval not found');
    return approval;
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
      if (!incident) throw new NotFoundException('Referenced incident not found');
      const siteId = toIdString(incident.siteId);
      if (!siteId) throw new BadRequestException('Referenced incident is missing site mapping');
      return siteId;
    }

    if (type === ApprovalType.CONSERVATION) {
      const project = await this.conservationModel
        .findOne({ _id: referenceId, isDeleted: { $ne: true } })
        .select('siteId')
        .lean()
        .exec();
      if (!project) throw new NotFoundException('Referenced conservation project not found');
      const siteId = toIdString(project.siteId);
      if (!siteId) throw new BadRequestException('Referenced conservation project is missing site mapping');
      return siteId;
    }

    const site = await this.siteModel
      .findOne({ _id: referenceId, isDeleted: { $ne: true } })
      .select('_id')
      .lean()
      .exec();
    if (!site) throw new NotFoundException('Referenced site not found');
    const siteId = toIdString(site._id);
    if (!siteId) throw new BadRequestException('Referenced site id is invalid');
    return siteId;
  }

  private async ensureApprovalReadAccess(approval: any, actor: any) {
    const role = getActorRole(actor);
    if (role === UserRole.NATIONAL_ADMIN) return;

    const actorId = getActorId(actor);
    const submittedById = toIdString(approval.submittedBy);

    if (role === UserRole.SITE_OFFICER && submittedById !== actorId) {
      throw new ForbiddenException('Site officers can only access their own approval requests');
    }

    const referenceId = toIdString(approval.referenceId);
    if (!referenceId) throw new BadRequestException('Approval has an invalid reference id');

    const referenceSiteId = await this.resolveReferenceSiteId(approval.type as ApprovalType, referenceId);
    await ensureSiteInScope(referenceSiteId, actor, this.siteModel);
  }

  private async filterApprovalsByScope(approvals: any[], actor: any): Promise<any[]> {
    const visible: any[] = [];
    for (const approval of approvals) {
      try {
        await this.ensureApprovalReadAccess(approval, actor);
        visible.push(approval);
      } catch (error) {
        if (!(error instanceof ForbiddenException)) throw error;
      }
    }
    return visible;
  }
}
