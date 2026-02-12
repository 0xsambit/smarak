import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum IncidentType {
  STRUCTURAL = 'STRUCTURAL',
  VANDALISM = 'VANDALISM',
  OVERCROWDING = 'OVERCROWDING',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  SECURITY = 'SECURITY',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

@Schema({ timestamps: true })
export class Incident extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, enum: IncidentType })
  type: IncidentType;

  @Prop({ required: true, enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: IncidentStatus, default: IncidentStatus.OPEN, index: true })
  status: IncidentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportedBy?: Types.ObjectId;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolutionNotes?: string;

  @Prop([String])
  images?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

// Create indexes
IncidentSchema.index({ siteId: 1, status: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ createdAt: -1 });

// Virtual field for days open
IncidentSchema.virtual('daysOpen').get(function () {
  if (this.status === IncidentStatus.RESOLVED && this.resolvedAt) {
    const diffTime = Math.abs(this.resolvedAt.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
