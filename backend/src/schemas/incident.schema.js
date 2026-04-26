import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const IncidentType = {
  STRUCTURAL: 'STRUCTURAL',
  VANDALISM: 'VANDALISM',
  OVERCROWDING: 'OVERCROWDING',
  ENVIRONMENTAL: 'ENVIRONMENTAL',
  SECURITY: 'SECURITY',
};

export const IncidentSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const IncidentStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
};

@Schema({ timestamps: true })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId;

  @Prop({ type: String, required: true, enum: Object.values(IncidentType) })
  type;

  @Prop({ type: String, required: true, enum: Object.values(IncidentSeverity) })
  severity;

  @Prop({ type: String, required: true })
  description;

  @Prop({ type: String, required: true, enum: Object.values(IncidentStatus), default: IncidentStatus.OPEN, index: true })
  status;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportedBy;

  @Prop({ type: Date })
  resolvedAt;

  @Prop({ type: String })
  resolutionNotes;

  @Prop([String])
  images;

  @Prop([String])
  imageFileIds;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted;

  @Prop({ type: Date })
  deletedAt;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

IncidentSchema.index({ siteId: 1, status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });

IncidentSchema.virtual('daysOpen').get(function () {
  if (this.status === IncidentStatus.RESOLVED && this.resolvedAt) {
    const diffTime = Math.abs(this.resolvedAt.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
