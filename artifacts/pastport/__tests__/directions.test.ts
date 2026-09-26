import { Alert, Linking, Platform } from 'react-native';
import {
  directionsUrl,
  googleTrailDirectionsUrlFromPlaces,
  openDirections,
  openTrailDirections,
  openTrailPlaces,
  trailDirectionsUrl,
  trailDirectionsUrlFromPlaces,
} from '@/lib/directions';
import { heritageTrailMapPlaces } from '@/data/pastport';

describe('directions', () => {
  const coordinate = { latitude: -33.0153, longitude: 27.9116 };
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it('builds a native directions link for the current platform', () => {
    Platform.OS = 'ios';
    expect(directionsUrl(coordinate, 'East London Railway Station')).toBe(
      'http://maps.apple.com/?daddr=-33.0153,27.9116&q=East%20London%20Railway%20Station&dirflg=d',
    );

    Platform.OS = 'android';
    expect(directionsUrl(coordinate)).toBe('google.navigation:q=-33.0153,27.9116');

    Platform.OS = 'web';
    expect(directionsUrl(coordinate)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-33.0153,27.9116&travelmode=driving',
    );
  });

  it('falls back to a web route when the native maps app cannot open', async () => {
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no maps app')).mockResolvedValueOnce(true as never);

    await openDirections(coordinate, 'East London Railway Station');

    expect(openURL).toHaveBeenNthCalledWith(1, 'google.navigation:q=-33.0153,27.9116');
    expect(openURL).toHaveBeenNthCalledWith(
      2,
      'https://www.google.com/maps/dir/?api=1&destination=-33.0153,27.9116&travelmode=driving',
    );
  });

  it('builds one walking route from hardcoded place names', () => {
    expect(googleTrailDirectionsUrlFromPlaces(heritageTrailMapPlaces)).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=East%20London%20Railway%20Station%2C%20Station%20Street%2C%20East%20London%2C%20South%20Africa&destination=East%20London%20Museum%2C%20Upper%20Oxford%20Street%2C%20East%20London%2C%20South%20Africa&waypoints=City%20Hall%2C%20Oxford%20Street%2C%20East%20London%2C%20South%20Africa%7CLatimer's%20Landing%2C%20East%20London%20Harbour%2C%20South%20Africa%7CFort%20Glamorgan%2C%20East%20London%2C%20South%20Africa&travelmode=walking",
    );

    Platform.OS = 'ios';
    expect(trailDirectionsUrlFromPlaces(heritageTrailMapPlaces, 'ios')).toContain('maps.apple.com');
    expect(trailDirectionsUrlFromPlaces(heritageTrailMapPlaces, 'ios')).toContain('dirflg=w');
  });

  it('prefers placeQuery labels when building a trail from stops', () => {
    const stops = [
      {
        name: 'Railway Station',
        coordinates: coordinate,
        placeQuery: 'East London Railway Station, Station Street, East London, South Africa',
      },
      {
        name: 'Fort Glamorgan',
        coordinates: { latitude: -33.03012, longitude: 27.90396 },
        placeQuery: 'Fort Glamorgan, East London, South Africa',
      },
    ];

    expect(trailDirectionsUrl(stops, 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=East%20London%20Railway%20Station%2C%20Station%20Street%2C%20East%20London%2C%20South%20Africa&destination=Fort%20Glamorgan%2C%20East%20London%2C%20South%20Africa&travelmode=walking',
    );
  });

  it('opens the full trail in Google Maps from hardcoded places', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    await openTrailPlaces(heritageTrailMapPlaces);

    expect(openURL).toHaveBeenCalledWith(trailDirectionsUrlFromPlaces(heritageTrailMapPlaces));
  });

  it('opens a trail from stop objects that include place queries', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const stops = [
      {
        name: 'Railway Station',
        coordinates: coordinate,
        placeQuery: 'East London Railway Station, Station Street, East London, South Africa',
      },
      {
        name: 'Fort Glamorgan',
        coordinates: { latitude: -33.03012, longitude: 27.90396 },
        placeQuery: 'Fort Glamorgan, East London, South Africa',
      },
    ];

    await openTrailDirections(stops);

    expect(openURL).toHaveBeenCalledWith(trailDirectionsUrl(stops));
  });

  it('tells the user when no directions link can be opened', async () => {
    Platform.OS = 'web';
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('blocked'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    await openDirections(coordinate);

    expect(alert).toHaveBeenCalledWith('Navigation unavailable', 'Unable to open directions for this place.');
  });
});
