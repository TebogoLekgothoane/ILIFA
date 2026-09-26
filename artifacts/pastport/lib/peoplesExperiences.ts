import { peoplesExperiences, type ExperienceKind, type PeopleExperience } from '@/data/peoplesExperiences';
import type { MapCoordinate } from '@/data/pastport';

export const DEFAULT_EXPERIENCE_RADIUS_KM = 3;
export const DEFAULT_EXPERIENCE_RADIUS_METERS = DEFAULT_EXPERIENCE_RADIUS_KM * 1000;

export type PlaceExperienceFilter = {
  siteId: string;
  origin: MapCoordinate;
  extras?: PeopleExperience[];
  /** Search radius in kilometres. Prefer `radiusMeters` when calling from UI. */
  radiusKm?: number;
  /** Search radius in metres (e.g. 2000 for a 2 km neighbourhood). */
  radiusMeters?: number;
};

export type ExperienceStats = {
  nearby: number;
  community: number;
  visitor: number;
  interviews: number;
};

export type ExperienceFeedFilter = 'all' | ExperienceKind;

export function radiusKmFromMeters(meters: number): number {
  return meters / 1000;
}

export function resolveRadiusKm({
  radiusKm,
  radiusMeters,
}: {
  radiusKm?: number;
  radiusMeters?: number;
}): number {
  if (typeof radiusMeters === 'number') return radiusKmFromMeters(radiusMeters);
  if (typeof radiusKm === 'number') return radiusKm;
  return DEFAULT_EXPERIENCE_RADIUS_KM;
}

export function haversineKm(from: MapCoordinate, to: MapCoordinate): number {
  const earthKm = 6371;
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);
  const startLatitude = degreesToRadians(from.latitude);
  const endLatitude = degreesToRadians(to.latitude);
  const square =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(square)));
}

export function isExperienceNearPlace(
  experience: PeopleExperience,
  siteId: string,
  origin: MapCoordinate,
  radiusKm = DEFAULT_EXPERIENCE_RADIUS_KM,
  options?: { matchSiteId?: boolean },
): boolean {
  const matchSiteId = options?.matchSiteId ?? true;
  if (matchSiteId && experience.siteId === siteId) return true;
  return haversineKm(origin, experience.coordinates) <= radiusKm;
}

export function experiencesForPlace({
  siteId,
  origin,
  extras = [],
  radiusKm,
  radiusMeters,
}: PlaceExperienceFilter): PeopleExperience[] {
  const resolvedRadiusKm = resolveRadiusKm({ radiusKm, radiusMeters });
  return [...extras, ...peoplesExperiences]
    .filter((experience) => isExperienceNearPlace(experience, siteId, origin, resolvedRadiusKm))
    .sort(compareExperiences);
}

export function experienceStats(experiences: PeopleExperience[]): ExperienceStats {
  return {
    nearby: experiences.length,
    community: countByKind(experiences, 'community'),
    visitor: countByKind(experiences, 'visitor'),
    interviews: countByKind(experiences, 'interview'),
  };
}

export function filterExperiencesByKind(
  experiences: PeopleExperience[],
  kind: ExperienceFeedFilter,
): PeopleExperience[] {
  if (kind === 'all') return experiences;
  return experiences.filter((experience) => experience.kind === kind);
}

export function initialsFromName(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z\s.]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'YU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function compareExperiences(left: PeopleExperience, right: PeopleExperience): number {
  if (Boolean(left.userSubmitted) !== Boolean(right.userSubmitted)) {
    return left.userSubmitted ? -1 : 1;
  }
  if (Boolean(left.storykeeper) !== Boolean(right.storykeeper)) {
    return left.storykeeper ? -1 : 1;
  }
  return right.sortKey.localeCompare(left.sortKey);
}

function countByKind(experiences: PeopleExperience[], kind: ExperienceKind): number {
  return experiences.filter((experience) => experience.kind === kind).length;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
