import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Footfall extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true })
  visitors: number;

  @Prop()
  revenue?: number;

  @Prop()
  peakHour?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const FootfallSchema = SchemaFactory.createForClass(Footfall);

// Create compound index for efficient queries
FootfallSchema.index({ siteId: 1, date: -1 });
FootfallSchema.index({ date: -1 });
