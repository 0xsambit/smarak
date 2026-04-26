import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../schemas/user.schema.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
