import { provinces, station } from '@/data/pastport';
import { provinceWithVisits, regionForPlaces, visitedPlacesInProvince } from '@/lib/visitedPlaces';

describe('visited places by province', () => {
  it('returns visited places for the matching province only', () => {
    expect(visitedPlacesInProvince([station.id], 'Eastern Cape').map((place) => place.name)).toEqual([
      station.name,
    ]);
    expect(visitedPlacesInProvince([station.id], 'Gauteng')).toEqual([]);
    expect(visitedPlacesInProvince([], 'Eastern Cape')).toEqual([]);
  });

  it('picks the first province that has a visit', () => {
    expect(provinceWithVisits([station.id])).toBe('Eastern Cape');
    expect(provinceWithVisits([])).toBeNull();
  });

  it('frames a single visit tightly and an empty province at the province scale', () => {
    const easternCape = provinces[0];
    expect(regionForPlaces([station.coordinates], easternCape)).toEqual({
      ...station.coordinates,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
    expect(regionForPlaces([], easternCape)).toEqual({
      ...easternCape.coordinates,
      latitudeDelta: easternCape.latitudeDelta,
      longitudeDelta: easternCape.longitudeDelta,
    });
  });
});
