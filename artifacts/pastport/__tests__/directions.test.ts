import { Alert, Linking, Platform } from 'react-native';
import { directionsUrl, openDirections, openTrailDirections, trailDirectionsUrl } from '@/lib/directions';

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

  it('builds one walking route that includes every trail stop in order', () => {
    const stops = [
      { name: 'Railway Station', coordinates: { latitude: -33.0153, longitude: 27.9116 } },
      { name: 'Historical Square', coordinates: { latitude: -33.01474, longitude: 27.90418 } },
      { name: "Latimer's Landing", coordinates: { latitude: -33.02201, longitude: 27.89522 } },
      { name: 'Fort Glamorgan', coordinates: { latitude: -33.03012, longitude: 27.90396 } },
      { name: 'East London Museum', coordinates: { latitude: -32.99591, longitude: 27.89539 } },
    ];

    expect(trailDirectionsUrl(stops, 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=-33.0153,27.9116&destination=-32.99591,27.89539&waypoints=-33.01474,27.90418|-33.02201,27.89522|-33.03012,27.90396&travelmode=walking',
    );
    expect(trailDirectionsUrl(stops, 'ios')).toBe(
      'http://maps.apple.com/?saddr=-33.0153,27.9116&daddr=-33.01474,27.90418+to:-33.02201,27.89522+to:-33.03012,27.90396+to:-32.99591,27.89539&dirflg=w',
    );
  });

  it('opens the full trail in Google Maps', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const stops = [
      { name: 'Railway Station', coordinates: coordinate },
      { name: 'Fort Glamorgan', coordinates: { latitude: -33.03012, longitude: 27.90396 } },
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
