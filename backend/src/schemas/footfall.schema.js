import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Footfall {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId;

  @Prop({ type: Date, required: true, index: true })
  date;

  @Prop({ type: Number, required: true })
  visitors;

  @Prop({ type: Number })
  revenue;

  @Prop({ type: String })
  peakHour;
}

export const FootfallSchema = SchemaFactory.createForClass(Footfall);

FootfallSchema.index({ siteId: 1, date: -1 });
FootfallSchema.index({ date: -1 });
