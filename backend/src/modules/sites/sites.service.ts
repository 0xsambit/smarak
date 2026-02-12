import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site } from '@schemas/site.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Injectable()
export class SitesService {
  constructor(@InjectModel(Site.name) private siteModel: Model<Site>) {}

  async create(createSiteDto: CreateSiteDto): Promise<Site> {
    const siteData = {
      ...createSiteDto,
      coordinates: {
        type: 'Point',
        coordinates: [createSiteDto.coordinates.longitude, createSiteDto.coordinates.latitude],
      },
    };

    const site = new this.siteModel(siteData);
    return site.save();
  }

  async findAll(query: QuerySitesDto): Promise<{ sites: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, state, riskLevel, protectionStatus, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (state) {
      filter.state = state;
    }

    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }

    if (protectionStatus) {
      filter.protectionStatus = protectionStatus;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    const [sites, total] = await Promise.all([
      this.siteModel.find(filter).skip(skip).limit(limit).lean().exec(),
      this.siteModel.countDocuments(filter),
    ]);

    return {
      sites,
      total,
      page,
      limit,
    };
  }

  async findNearby(nearbyQuery: NearbyQueryDto): Promise<any[]> {
    const { latitude, longitude, maxDistance } = nearbyQuery;

    const sites = await this.siteModel
      .find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .limit(20)
      .lean()
      .exec();

    return sites;
  }

  async findOne(id: string): Promise<any> {
    const site = await this.siteModel.findById(id).lean().exec();

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto): Promise<Site> {
    let updateData: any = { ...updateSiteDto };

    if (updateSiteDto.coordinates) {
      updateData.coordinates = {
        type: 'Point',
        coordinates: [updateSiteDto.coordinates.longitude, updateSiteDto.coordinates.latitude],
      };
    }

    const site = await this.siteModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async remove(id: string): Promise<void> {
    const result = await this.siteModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Site not found');
    }
  }

  async getStatistics(id: string): Promise<any> {
    const site = await this.findOne(id);

    // Get related counts using aggregation
    const stats = await this.siteModel.aggregate([
      { $match: { _id: site._id } },
      {
        $lookup: {
          from: 'incidents',
          localField: '_id',
          foreignField: 'siteId',
          as: 'incidents',
        },
      },
      {
        $lookup: {
          from: 'conservations',
          localField: '_id',
          foreignField: 'siteId',
          as: 'conservations',
        },
      },
      {
        $project: {
          name: 1,
          state: 1,
          district: 1,
          riskLevel: 1,
          protectionStatus: 1,
          visitorCapacity: 1,
          lastInspectionDate: 1,
          totalIncidents: { $size: '$incidents' },
          activeIncidents: {
            $size: {
              $filter: {
                input: '$incidents',
                as: 'incident',
                cond: { $eq: ['$$incident.status', 'OPEN'] },
              },
            },
          },
          totalConservationProjects: { $size: '$conservations' },
          ongoingConservation: {
            $size: {
              $filter: {
                input: '$conservations',
                as: 'conservation',
                cond: { $eq: ['$$conservation.status', 'ONGOING'] },
              },
            },
          },
        },
      },
    ]);

    return stats[0] || {};
  }
}
