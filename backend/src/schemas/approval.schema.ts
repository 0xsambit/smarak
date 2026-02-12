import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ApprovalType {
  CONSERVATION = 'CONSERVATION',
  INCIDENT = 'INCIDENT',
  REPORT = 'REPORT',
  BUDGET = 'BUDGET',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Approval extends Document {
  @Prop({ required: true, enum: ApprovalType })
  type: ApprovalType;

  @Prop({ type: Types.ObjectId, required: true })
  referenceId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submittedBy?: Types.ObjectId;

  @Prop({ required: true, enum: ApprovalStatus, default: ApprovalStatus.PENDING, index: true })
  status: ApprovalStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewNotes?: string;

  @Prop({ default: false })
  isPriority: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);

// Create indexes
ApprovalSchema.index({ status: 1, submittedBy: 1 });
ApprovalSchema.index({ type: 1 });
ApprovalSchema.index({ createdAt: -1 });
ApprovalSchema.index({ isPriority: -1 });
