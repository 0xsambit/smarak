import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalsService } from './approvals.service.js';
import { ApprovalsController } from './approvals.controller.js';
import { Approval, ApprovalSchema } from '../../schemas/approval.schema.js';
import { Incident, IncidentSchema } from '../../schemas/incident.schema.js';
import { Conservation, ConservationSchema } from '../../schemas/conservation.schema.js';
import { Site, SiteSchema } from '../../schemas/site.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Approval.name, schema: ApprovalSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Conservation.name, schema: ConservationSchema },
      { name: Site.name, schema: SiteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
