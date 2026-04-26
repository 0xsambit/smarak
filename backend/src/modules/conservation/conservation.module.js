import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConservationService } from './conservation.service.js';
import { ConservationController } from './conservation.controller.js';
import { Conservation, ConservationSchema } from '../../schemas/conservation.schema.js';
import { Site, SiteSchema } from '../../schemas/site.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conservation.name, schema: ConservationSchema },
      { name: Site.name, schema: SiteSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ConservationController],
  providers: [ConservationService],
  exports: [ConservationService],
})
export class ConservationModule {}
