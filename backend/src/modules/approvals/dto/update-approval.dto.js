import { PartialType } from '@nestjs/swagger';
import { CreateApprovalDto } from './create-approval.dto.js';

export class UpdateApprovalDto extends PartialType(CreateApprovalDto) {}
