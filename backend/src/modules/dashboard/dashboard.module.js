import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';
import { Site, SiteSchema } from '../../schemas/site.schema.js';
import { Incident, IncidentSchema } from '../../schemas/incident.schema.js';
import { Conservation, ConservationSchema } from '../../schemas/conservation.schema.js';
import { Approval, ApprovalSchema } from '../../schemas/approval.schema.js';
import { Footfall, FootfallSchema } from '../../schemas/footfall.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Conservation.name, schema: ConservationSchema },
      { name: Approval.name, schema: ApprovalSchema },
      { name: Footfall.name, schema: FootfallSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
