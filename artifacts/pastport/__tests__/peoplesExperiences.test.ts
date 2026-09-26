import { station } from '@/data/pastport';
import { peoplesExperiences } from '@/data/peoplesExperiences';
import {
  experienceStats,
  experiencesForPlace,
  filterExperiencesByKind,
  initialsFromName,
  isExperienceNearPlace,
} from '@/lib/peoplesExperiences';

describe('people experiences around a place', () => {
  const nearby = experiencesForPlace({ siteId: station.id, origin: station.coordinates });

  it('keeps only memories tied to the place being explored', () => {
    expect(nearby.map((experience) => experience.displayName)).toContain('Nomhle M.');
    expect(nearby.map((experience) => experience.displayName)).toContain('Sipho K.');
    expect(nearby.some((experience) => experience.siteId === 'district-six')).toBe(false);
    expect(nearby.every((experience) => isExperienceNearPlace(experience, station.id, station.coordinates))).toBe(true);
  });

  it('summarises nearby community, visitor and interview voices', () => {
    expect(experienceStats(nearby)).toEqual({
      nearby: 24,
      community: 8,
      visitor: 11,
      interviews: 5,
    });
  });

  it('filters the feed by kind without losing the location scope', () => {
    expect(filterExperiencesByKind(nearby, 'community')).toHaveLength(8);
    expect(filterExperiencesByKind(nearby, 'visitor').every((experience) => experience.kind === 'visitor')).toBe(true);
    expect(filterExperiencesByKind(nearby, 'all')).toHaveLength(24);
  });

  it('places recordings around the station, not only on the building', () => {
    const offsets = nearby.filter((experience) => (
      experience.coordinates.latitude !== station.coordinates.latitude ||
      experience.coordinates.longitude !== station.coordinates.longitude
    ));
    expect(offsets.length).toBeGreaterThan(10);
    expect(peoplesExperiences.some((experience) => experience.siteId === 'district-six')).toBe(true);
  });

  it('reads initials from a preferred display name', () => {
    expect(initialsFromName('Nomhle M.')).toBe('NM');
    expect(initialsFromName('You')).toBe('YO');
  });

  it('accepts a neighbourhood radius in metres', () => {
    const withinTwoKm = experiencesForPlace({
      siteId: station.id,
      origin: station.coordinates,
      radiusMeters: 2000,
    });
    expect(withinTwoKm.some((experience) => experience.siteId === 'district-six')).toBe(false);
    expect(withinTwoKm.map((experience) => experience.displayName)).toContain('Nomhle M.');
  });
});
