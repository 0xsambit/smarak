import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '@schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ clerkId: createUserDto.clerkId });

    if (existingUser) {
      throw new ConflictException('User with this Clerk ID already exists');
    }

    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(query: QueryUsersDto): Promise<{ users: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const user = await this.userModel.findById(id).lean().exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByClerkId(clerkId: string): Promise<any | null> {
    return this.userModel.findOne({ clerkId }).lean().exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateByClerkId(clerkId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ clerkId }, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndUpdate(id, { isActive: false }).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async removeByClerkId(clerkId: string): Promise<void> {
    await this.userModel.findOneAndUpdate({ clerkId }, { isActive: false }).exec();
  }
}
