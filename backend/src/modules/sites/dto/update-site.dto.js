import { PartialType } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto.js';

export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
