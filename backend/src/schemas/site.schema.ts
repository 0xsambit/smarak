import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ProtectionStatus {
  PROTECTED = 'PROTECTED',
  RESTRICTED = 'RESTRICTED',
  OPEN = 'OPEN',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Coordinates {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

@Schema({ timestamps: true })
export class Site extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  district: string;

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
  coordinates: Coordinates;

  @Prop({ required: true, enum: ProtectionStatus, default: ProtectionStatus.OPEN })
  protectionStatus: ProtectionStatus;

  @Prop({ required: true, enum: RiskLevel, default: RiskLevel.LOW })
  riskLevel: RiskLevel;

  @Prop()
  lastInspectionDate: Date;

  @Prop({ required: true })
  visitorCapacity: number;

  @Prop()
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// Create 2dsphere index for geospatial queries
SiteSchema.index({ coordinates: '2dsphere' });
SiteSchema.index({ state: 1 });
SiteSchema.index({ riskLevel: 1 });
SiteSchema.index({ protectionStatus: 1 });

// Virtual field for days since last inspection
SiteSchema.virtual('daysSinceInspection').get(function () {
  if (!this.lastInspectionDate) return null;
  const diffTime = Math.abs(new Date().getTime() - this.lastInspectionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});
