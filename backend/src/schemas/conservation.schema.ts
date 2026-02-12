import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ConservationStatus {
  PLANNED = 'PLANNED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Conservation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true })
  issueType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop([String])
  beforeImages: string[];

  @Prop([String])
  afterImages: string[];

  @Prop({ required: true })
  contractor: string;

  @Prop({ required: true })
  budget: number;

  @Prop({ required: true, enum: ConservationStatus, default: ConservationStatus.PLANNED })
  status: ConservationStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  completionNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ConservationSchema = SchemaFactory.createForClass(Conservation);

// Create indexes
ConservationSchema.index({ siteId: 1, status: 1 });
ConservationSchema.index({ status: 1 });
ConservationSchema.index({ startDate: 1 });
