import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const ConservationStatus = {
  PLANNED: 'PLANNED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

@Schema({ timestamps: true })
export class Conservation {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId;

  @Prop({ type: String, required: true })
  issueType;

  @Prop({ type: String, required: true })
  title;

  @Prop({ type: String, required: true })
  description;

  @Prop([String])
  beforeImages;

  @Prop([String])
  beforeImageFileIds;

  @Prop([String])
  afterImages;

  @Prop([String])
  afterImageFileIds;

  @Prop({ type: String, required: true })
  contractor;

  @Prop({ type: Number, required: true })
  budget;

  @Prop({ type: String, required: true, enum: Object.values(ConservationStatus), default: ConservationStatus.PLANNED })
  status;

  @Prop({ type: Date, required: true })
  startDate;

  @Prop({ type: Date })
  endDate;

  @Prop({ type: String })
  completionNotes;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted;

  @Prop({ type: Date })
  deletedAt;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy;
}

export const ConservationSchema = SchemaFactory.createForClass(Conservation);

ConservationSchema.index({ siteId: 1, status: 1 });
ConservationSchema.index({ status: 1 });
ConservationSchema.index({ startDate: 1 });
ConservationSchema.index({ isDeleted: 1, status: 1, startDate: -1 });
