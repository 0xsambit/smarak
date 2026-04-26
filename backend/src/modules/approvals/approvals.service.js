import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Approval, ApprovalStatus, ApprovalType } from '../../schemas/approval.schema.js';
import { Incident } from '../../schemas/incident.schema.js';
import { Conservation } from '../../schemas/conservation.schema.js';
import { Site } from '../../schemas/site.schema.js';
import { UserRole } from '../../schemas/user.schema.js';
import {
  ensureSiteInScope,
  getActorId,
  getActorRole,
  toIdString,
} from '../../common/scope/scope.utils.js';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(Approval.name) approvalModel,
    @InjectModel(Incident.name) incidentModel,
    @InjectModel(Conservation.name) conservationModel,
    @InjectModel(Site.name) siteModel,
  ) {
    this.approvalModel = approvalModel;
    this.incidentModel = incidentModel;
    this.conservationModel = conservationModel;
    this.siteModel = siteModel;
  }

  async create(dto, actor) {
    const referenceSiteId = await this.resolveReferenceSiteId(dto.type, dto.referenceId);
    await ensureSiteInScope(referenceSiteId, actor, this.siteModel);

    const approval = new this.approvalModel({
      ...dto,
      submittedBy: new Types.ObjectId(getActorId(actor)),
    });
    return approval.save();
  }

  async findAll(query, actor) {
    const { page = 1, limit = 10, status, type, archived } = query;
    const skip = (page - 1) * limit;

    const filter = archived ? { isDeleted: true } : { isDeleted: { $ne: true } };
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

  async update(id, dto, actor) {
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

  async review(id, dto, reviewer) {
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

  async remove(id, userId) {
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

  async restore(id) {
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

  async resolveReferenceSiteId(type, referenceId) {
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

  async ensureApprovalReadAccess(approval, actor) {
    const role = getActorRole(actor);
    if (role === UserRole.NATIONAL_ADMIN) return;

    const actorId = getActorId(actor);
    const submittedById = toIdString(approval.submittedBy);

    if (role === UserRole.SITE_OFFICER && submittedById !== actorId) {
      throw new ForbiddenException('Site officers can only access their own approval requests');
    }

    const referenceId = toIdString(approval.referenceId);
    if (!referenceId) throw new BadRequestException('Approval has an invalid reference id');

    const referenceSiteId = await this.resolveReferenceSiteId(approval.type, referenceId);
    await ensureSiteInScope(referenceSiteId, actor, this.siteModel);
  }

  async filterApprovalsByScope(approvals, actor) {
    const visible = [];
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
