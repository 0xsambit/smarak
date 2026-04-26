import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const ProtectionStatus = {
  PROTECTED: 'PROTECTED',
  RESTRICTED: 'RESTRICTED',
  OPEN: 'OPEN',
};

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

@Schema({ timestamps: true })
export class Site {
  @Prop({ type: String, required: true })
  name;

  @Prop({ type: String, required: true })
  state;

  @Prop({ type: String, required: true })
  district;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  coordinates;

  @Prop({ type: String, required: true, enum: Object.values(ProtectionStatus), default: ProtectionStatus.OPEN })
  protectionStatus;

  @Prop({ type: String, required: true, enum: Object.values(RiskLevel), default: RiskLevel.LOW })
  riskLevel;

  @Prop({ type: Date })
  lastInspectionDate;

  @Prop({ type: Number, required: true })
  visitorCapacity;

  @Prop({ type: String })
  description;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted;

  @Prop({ type: Date })
  deletedAt;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ coordinates: '2dsphere' });
SiteSchema.index({ state: 1 });
SiteSchema.index({ riskLevel: 1 });
SiteSchema.index({ protectionStatus: 1 });
SiteSchema.index({ isDeleted: 1, state: 1 });

SiteSchema.virtual('daysSinceInspection').get(function () {
  if (!this.lastInspectionDate) return null;
  const diffTime = Math.abs(new Date().getTime() - this.lastInspectionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});
