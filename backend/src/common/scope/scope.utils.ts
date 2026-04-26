import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Site } from '@schemas/site.schema';
import { UserRole } from '@schemas/user.schema';

export function toIdString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return toIdString((value as any)._id);
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const asString = (value as { toString: () => string }).toString();
    return asString && asString !== '[object Object]' ? asString : null;
  }
  return null;
}

export function extractSiteId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return extractSiteId((value as any)._id);
  }
  throw new BadRequestException('Record is missing site context');
}

export function getActorId(actor: any): string {
  const actorId = toIdString(actor?._id) || toIdString(actor?.id);
  if (!actorId || !Types.ObjectId.isValid(actorId)) {
    throw new ForbiddenException('Unable to resolve authenticated user identity');
  }
  return actorId;
}

export function getActorRole(actor: any): UserRole {
  const role = actor?.role as UserRole | undefined;
  if (!role) {
    throw new ForbiddenException('Authenticated user role is unavailable');
  }
  return role;
}

export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function resolveActorState(actor: any, siteModel: Model<Site>): Promise<string | null> {
  const candidateIds = [toIdString(actor?.stateId), toIdString(actor?.siteId)].filter(
    (candidate): candidate is string => !!candidate,
  );

  for (const candidateId of candidateIds) {
    if (!Types.ObjectId.isValid(candidateId)) continue;
    const site = await siteModel.findById(candidateId).select('state').lean().exec();
    if (site?.state) return site.state;
  }
  return null;
}

export async function getScopedSiteIds(
  actor: any,
  siteModel: Model<Site>,
): Promise<Types.ObjectId[] | null> {
  const role = getActorRole(actor);

  if (role === UserRole.NATIONAL_ADMIN) return null;

  if (role === UserRole.SITE_OFFICER) {
    const siteId = toIdString(actor?.siteId);
    if (!siteId || !Types.ObjectId.isValid(siteId)) {
      throw new ForbiddenException('Site officer must be assigned to a site');
    }
    return [new Types.ObjectId(siteId)];
  }

  const assignedState = await resolveActorState(actor, siteModel);
  if (!assignedState) {
    throw new ForbiddenException('State admin must be assigned to a state or site');
  }

  const sites = await siteModel
    .find({ state: assignedState, isDeleted: { $ne: true } })
    .select('_id')
    .lean()
    .exec();
  return sites.map((site: any) => new Types.ObjectId(site._id));
}

export async function ensureSiteInScope(
  siteId: string | Types.ObjectId,
  actor: any,
  siteModel: Model<Site>,
): Promise<void> {
  const normalizedSiteId = toIdString(siteId);
  if (!normalizedSiteId || !Types.ObjectId.isValid(normalizedSiteId)) {
    throw new BadRequestException('Invalid site id');
  }

  const site = await siteModel
    .findOne({ _id: normalizedSiteId, isDeleted: { $ne: true } })
    .select('_id state')
    .lean()
    .exec();
  if (!site) throw new NotFoundException('Site not found');

  const role = getActorRole(actor);
  if (role === UserRole.NATIONAL_ADMIN) return;

  if (role === UserRole.SITE_OFFICER) {
    const actorSiteId = toIdString(actor?.siteId);
    if (!actorSiteId || actorSiteId !== normalizedSiteId) {
      throw new ForbiddenException('Site officer can only act within assigned site scope');
    }
    return;
  }

  const assignedState = await resolveActorState(actor, siteModel);
  if (!assignedState) {
    throw new ForbiddenException('State admin must be assigned to a state or site');
  }
  if (site.state.trim().toLowerCase() !== assignedState.trim().toLowerCase()) {
    throw new ForbiddenException('State admin can only act within assigned state scope');
  }
}
