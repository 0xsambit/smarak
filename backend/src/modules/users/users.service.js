import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) userModel) {
    this.userModel = userModel;
  }

  async create(payload) {
    const email = payload.email.trim().toLowerCase();
    const existingByClerkId = await this.userModel.findOne({ clerkId: payload.clerkId }).lean().exec();
    const existingByEmail = await this.userModel.findOne({ email }).lean().exec();

    if (
      existingByClerkId &&
      existingByEmail &&
      existingByClerkId._id?.toString() !== existingByEmail._id?.toString()
    ) {
      throw new ConflictException('User identity conflict for provided clerkId and email');
    }

    const existingUser = existingByClerkId || existingByEmail;

    if (existingUser) {
      const updated = await this.userModel
        .findByIdAndUpdate(existingUser._id, { ...payload, email, isActive: true }, { new: true })
        .exec();
      if (!updated) throw new ConflictException('Unable to update existing user');
      return updated;
    }

    return new this.userModel({ ...payload, email }).save();
  }

  async updateByClerkId(clerkId, updateData) {
    const email =
      typeof updateData.email === 'string' ? updateData.email.trim().toLowerCase() : undefined;
    const payload = { ...updateData, ...(email ? { email } : {}) };

    let user = await this.userModel.findOneAndUpdate({ clerkId }, payload, { new: true }).exec();
    if (!user && email) {
      user = await this.userModel
        .findOneAndUpdate({ email }, { ...payload, clerkId }, { new: true })
        .exec();
    }
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async removeByClerkId(clerkId) {
    await this.userModel.findOneAndUpdate({ clerkId }, { isActive: false }).exec();
  }
}
