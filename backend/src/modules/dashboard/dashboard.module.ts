import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Site, SiteSchema } from '@schemas/site.schema';
import { Incident, IncidentSchema } from '@schemas/incident.schema';
import { Conservation, ConservationSchema } from '@schemas/conservation.schema';
import { Approval, ApprovalSchema } from '@schemas/approval.schema';
import { Footfall, FootfallSchema } from '@schemas/footfall.schema';
import { User, UserSchema } from '@schemas/user.schema';

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
