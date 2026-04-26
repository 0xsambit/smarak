import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const UserRole = {
  NATIONAL_ADMIN: 'NATIONAL_ADMIN',
  STATE_ADMIN: 'STATE_ADMIN',
  SITE_OFFICER: 'SITE_OFFICER',
};

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  clerkId;

  @Prop({ type: String, required: true })
  name;

  @Prop({ type: String, required: true, unique: true })
  email;

  @Prop({ type: String, required: true, enum: Object.values(UserRole), default: UserRole.SITE_OFFICER })
  role;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  stateId;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  siteId;

  @Prop({ type: Boolean, default: true })
  isActive;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
