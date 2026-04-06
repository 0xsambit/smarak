import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Approval, ApprovalStatus } from '@schemas/approval.schema';
import { UserRole } from '@schemas/user.schema';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(@InjectModel(Approval.name) private approvalModel: Model<Approval>) {}

  async create(createApprovalDto: CreateApprovalDto, userId: string): Promise<Approval> {
    const approval = new this.approvalModel({
      ...createApprovalDto,
      submittedBy: new Types.ObjectId(userId),
    });
    return approval.save();
  }

  async findAll(query: QueryApprovalsDto): Promise<{ approvals: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, type } = query;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: { $ne: true } };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const [approvals, total] = await Promise.all([
      this.approvalModel
        .find(filter)
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ isPriority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.approvalModel.countDocuments(filter),
    ]);

    return {
      approvals,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const approval = await this.approvalModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean()
      .exec();

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return approval;
  }

  async update(
    id: string,
    updateApprovalDto: UpdateApprovalDto,
    actor: { id: string; role?: string },
  ): Promise<Approval> {
    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending approvals can be edited');
    }

    const canEditAny =
      actor.role === UserRole.NATIONAL_ADMIN || actor.role === UserRole.STATE_ADMIN;
    const isSubmitter = approval.submittedBy?.toString() === actor.id;

    if (!canEditAny && !isSubmitter) {
      throw new ForbiddenException('You can only edit approvals submitted by you');
    }

    Object.assign(approval, updateApprovalDto);
    return approval.save();
  }

  async review(id: string, reviewApprovalDto: ReviewApprovalDto, reviewerId: string): Promise<Approval> {
    const approval = await this.approvalModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

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
}
