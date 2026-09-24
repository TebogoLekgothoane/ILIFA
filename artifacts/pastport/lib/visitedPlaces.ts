import { places, provinces, type HeritagePlace, type MapCoordinate, type Province } from '@/data/pastport';

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export function visitedPlacesInProvince(visitedIds: string[], province: string): HeritagePlace[] {
  return places.filter((place) => place.province === province && visitedIds.includes(place.id));
}

export function provinceWithVisits(visitedIds: string[]): string | null {
  return provinces.find((province) => visitedPlacesInProvince(visitedIds, province.name).length > 0)?.name ?? null;
}

export function regionForPlaces(points: MapCoordinate[], province: Province): MapRegion {
  if (points.length === 0) {
    return {
      ...province.coordinates,
      latitudeDelta: province.latitudeDelta,
      longitudeDelta: province.longitudeDelta,
    };
  }

  if (points.length === 1) {
    return { ...points[0], latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.8, 0.08),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.8, 0.08),
  };
}
