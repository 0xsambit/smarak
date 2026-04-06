import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentStatus } from '@schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(@InjectModel(Incident.name) private incidentModel: Model<Incident>) {}

  async create(createIncidentDto: CreateIncidentDto, userId: string): Promise<Incident> {
    const incident = new this.incidentModel({
      ...createIncidentDto,
      reportedBy: new Types.ObjectId(userId),
    });
    return incident.save();
  }

  async findAll(query: QueryIncidentsDto): Promise<{ incidents: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, siteId, status, severity } = query;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: { $ne: true } };

    if (siteId) {
      filter.siteId = new Types.ObjectId(siteId);
    }

    if (status) {
      filter.status = status;
    }

    if (severity) {
      filter.severity = severity;
    }

    const [incidents, total] = await Promise.all([
      this.incidentModel
        .find(filter)
        .populate('siteId', 'name state district')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.incidentModel.countDocuments(filter),
    ]);

    return {
      incidents,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const incident = await this.incidentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('siteId', 'name state district')
      .populate('reportedBy', 'name email')
      .lean()
      .exec();

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async updateStatus(id: string, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.incidentModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Validate status transitions
    if (updateIncidentDto.status) {
      if (incident.status === IncidentStatus.RESOLVED) {
        throw new BadRequestException('Cannot update a resolved incident');
      }

      if (updateIncidentDto.status === IncidentStatus.RESOLVED) {
        incident.resolvedAt = new Date();
      }
    }

    Object.assign(incident, updateIncidentDto);
    return incident.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.incidentModel
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
      throw new NotFoundException('Incident not found');
    }
  }

  async restore(id: string): Promise<Incident> {
    const incident = await this.incidentModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        {
          $set: { isDeleted: false },
          $unset: { deletedAt: 1, deletedBy: 1 },
        },
        { new: true },
      )
      .exec();

    if (!incident) {
      throw new NotFoundException('Archived incident not found');
    }

    return incident;
  }

  // Method for dashboard: count by severity
  async countBySeverity(): Promise<any> {
    return this.incidentModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $ne: IncidentStatus.RESOLVED },
        },
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}
