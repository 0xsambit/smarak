import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConservationService } from './conservation.service';
import { ConservationController } from './conservation.controller';
import { Conservation, ConservationSchema } from '@schemas/conservation.schema';
import { Site, SiteSchema } from '@schemas/site.schema';
import { User, UserSchema } from '@schemas/user.schema';

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
