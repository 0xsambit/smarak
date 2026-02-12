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

    const filter: any = {};

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
      .findById(id)
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
      .findByIdAndUpdate(id, updateConservationDto, { new: true })
      .exec();

    if (!conservation) {
      throw new NotFoundException('Conservation project not found');
    }

    return conservation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.conservationModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Conservation project not found');
    }
  }
}
