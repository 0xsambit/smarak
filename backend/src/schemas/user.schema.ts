import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  NATIONAL_ADMIN = 'NATIONAL_ADMIN',
  STATE_ADMIN = 'STATE_ADMIN',
  SITE_OFFICER = 'SITE_OFFICER',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  clerkId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.SITE_OFFICER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  stateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  siteId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
