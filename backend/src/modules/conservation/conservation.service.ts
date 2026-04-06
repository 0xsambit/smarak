import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conservation } from '@schemas/conservation.schema';
import { CreateConservationDto } from './dto/create-conservation.dto';
import { UpdateConservationDto } from './dto/update-conservation.dto';
import { QueryConservationDto } from './dto/query-conservation.dto';

@Injectable()
export class ConservationService {
  constructor(@InjectModel(Conservation.name) private conservationModel: Model<Conservation>) {}

  async create(createConservationDto: CreateConservationDto, userId: string): Promise<Conservation> {
    const conservation = new this.conservationModel({
      ...createConservationDto,
      createdBy: new Types.ObjectId(userId),
    });
    return conservation.save();
  }

  async findAll(query: QueryConservationDto): Promise<{ projects: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, siteId, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: { $ne: true } };

    if (siteId) {
      filter.siteId = new Types.ObjectId(siteId);
    }

    if (status) {
      filter.status = status;
    }

    const [projects, total] = await Promise.all([
      this.conservationModel
        .find(filter)
        .populate('siteId', 'name state district')
        .populate('createdBy', 'name email')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.conservationModel.countDocuments(filter),
    ]);

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const conservation = await this.conservationModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('siteId', 'name state district')
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    if (!conservation) {
      throw new NotFoundException('Conservation project not found');
    }

    return conservation;
  }

  async update(id: string, updateConservationDto: UpdateConservationDto): Promise<Conservation> {
    const conservation = await this.conservationModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, updateConservationDto, { new: true })
      .exec();

    if (!conservation) {
      throw new NotFoundException('Conservation project not found');
    }

    return conservation;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.conservationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(userId),
        },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Conservation project not found');
    }
  }

  async restore(id: string): Promise<Conservation> {
    const conservation = await this.conservationModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        {
          $set: { isDeleted: false },
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { new: true },
      )
      .exec();

    if (!conservation) {
      throw new NotFoundException('Archived conservation project not found');
    }

    return conservation;
  }
}
