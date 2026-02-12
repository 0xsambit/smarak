import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Approval, ApprovalStatus } from '@schemas/approval.schema';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';

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

    const filter: any = {};

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
      .findById(id)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean()
      .exec();

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return approval;
  }

  async review(id: string, reviewApprovalDto: ReviewApprovalDto, reviewerId: string): Promise<Approval> {
    const approval = await this.approvalModel.findById(id);

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

  async remove(id: string): Promise<void> {
    const result = await this.approvalModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Approval not found');
    }
  }

  // Helper method for dashboard: count pending approvals
  async countPending(): Promise<number> {
    return this.approvalModel.countDocuments({ status: ApprovalStatus.PENDING });
  }
}
