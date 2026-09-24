import { Alert, Linking, Platform } from 'react-native';
import type { MapCoordinate } from '@/data/pastport';

export function directionsUrl(coordinate: MapCoordinate, name?: string) {
  const destination = `${coordinate.latitude},${coordinate.longitude}`;
  const label = encodeURIComponent(name ?? 'Destination');

  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&q=${label}&dirflg=d`;
  }

  if (Platform.OS === 'android') {
    return `google.navigation:q=${destination}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

function webDirectionsUrl(coordinate: MapCoordinate) {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinate.latitude},${coordinate.longitude}&travelmode=driving`;
}

export type TrailStop = {
  name: string;
  coordinates: MapCoordinate;
};

function coordinatePin(stop: TrailStop) {
  return `${stop.coordinates.latitude},${stop.coordinates.longitude}`;
}

export function mapsAppName(os: typeof Platform.OS = Platform.OS) {
  return os === 'ios' ? 'Maps' : 'Google Maps';
}

function googleTrailDirectionsUrl(stops: TrailStop[]) {
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinatePin(stops[0])}&travelmode=walking`;
  }

  const origin = coordinatePin(stops[0]);
  const destination = coordinatePin(stops[stops.length - 1]);
  const waypoints = stops.slice(1, -1).map(coordinatePin).join('|');
  const waypointQuery = waypoints ? `&waypoints=${waypoints}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=walking`;
}

function appleTrailDirectionsUrl(stops: TrailStop[]) {
  if (stops.length === 1) {
    return `http://maps.apple.com/?daddr=${coordinatePin(stops[0])}&dirflg=w`;
  }

  const origin = coordinatePin(stops[0]);
  const destinations = stops.slice(1).map(coordinatePin).join('+to:');
  return `http://maps.apple.com/?saddr=${origin}&daddr=${destinations}&dirflg=w`;
}

export function trailDirectionsUrl(stops: TrailStop[], os: typeof Platform.OS = Platform.OS) {
  if (stops.length === 0) {
    throw new Error('A trail needs at least one stop.');
  }

  return os === 'ios' ? appleTrailDirectionsUrl(stops) : googleTrailDirectionsUrl(stops);
}

export async function openTrailDirections(stops: TrailStop[]) {
  try {
    await Linking.openURL(trailDirectionsUrl(stops));
  } catch {
    Alert.alert('Navigation unavailable', `Unable to open this trail in ${mapsAppName()}.`);
  }
}

export async function openDirections(coordinate: MapCoordinate, name?: string) {
  const primary = directionsUrl(coordinate, name);

  try {
    await Linking.openURL(primary);
    return;
  } catch {
    const fallback = webDirectionsUrl(coordinate);
    if (fallback === primary) {
      Alert.alert('Navigation unavailable', 'Unable to open directions for this place.');
      return;
    }

    try {
      await Linking.openURL(fallback);
    } catch {
      Alert.alert('Navigation unavailable', 'Unable to open directions for this place.');
    }
  }
}
