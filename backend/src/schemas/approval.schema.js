import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const ApprovalType = {
  CONSERVATION: 'CONSERVATION',
  INCIDENT: 'INCIDENT',
  REPORT: 'REPORT',
  BUDGET: 'BUDGET',
};

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

@Schema({ timestamps: true })
export class Approval {
  @Prop({ type: String, required: true, enum: Object.values(ApprovalType) })
  type;

  @Prop({ type: Types.ObjectId, required: true })
  referenceId;

  @Prop({ type: String, required: true })
  title;

  @Prop({ type: String })
  description;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submittedBy;

  @Prop({ type: String, required: true, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING, index: true })
  status;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy;

  @Prop({ type: Date })
  reviewedAt;

  @Prop({ type: String })
  reviewNotes;

  @Prop({ type: Boolean, default: false })
  isPriority;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted;

  @Prop({ type: Date })
  deletedAt;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);

ApprovalSchema.index({ status: 1, submittedBy: 1 });
ApprovalSchema.index({ type: 1 });
ApprovalSchema.index({ createdAt: -1 });
ApprovalSchema.index({ isPriority: -1 });
ApprovalSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
