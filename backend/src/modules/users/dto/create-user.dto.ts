import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsString()
  clerkId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@asi.gov.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SITE_OFFICER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  stateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  siteId?: string;
}
