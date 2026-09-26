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
  placeQuery?: string;
};

export function mapsAppName(os: typeof Platform.OS = Platform.OS) {
  return os === 'ios' ? 'Maps' : 'Google Maps';
}

function placePin(stop: TrailStop) {
  return stop.placeQuery?.trim() || `${stop.coordinates.latitude},${stop.coordinates.longitude}`;
}

function encodePlace(value: string) {
  return encodeURIComponent(value);
}

/** Hardcoded place-name walking route for Google Maps. */
export function googleTrailDirectionsUrlFromPlaces(places: string[]) {
  if (places.length === 0) {
    throw new Error('A trail needs at least one stop.');
  }

  if (places.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodePlace(places[0])}&travelmode=walking`;
  }

  const origin = encodePlace(places[0]);
  const destination = encodePlace(places[places.length - 1]);
  const middle = places.slice(1, -1).map(encodePlace).join('%7C');
  const waypointQuery = middle ? `&waypoints=${middle}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=walking`;
}

function appleTrailDirectionsUrlFromPlaces(places: string[]) {
  if (places.length === 0) {
    throw new Error('A trail needs at least one stop.');
  }

  if (places.length === 1) {
    return `http://maps.apple.com/?daddr=${encodePlace(places[0])}&dirflg=w`;
  }

  const origin = encodePlace(places[0]);
  const destinations = places.slice(1).map(encodePlace).join('+to:');
  return `http://maps.apple.com/?saddr=${origin}&daddr=${destinations}&dirflg=w`;
}

export function trailDirectionsUrlFromPlaces(places: string[], os: typeof Platform.OS = Platform.OS) {
  return os === 'ios' ? appleTrailDirectionsUrlFromPlaces(places) : googleTrailDirectionsUrlFromPlaces(places);
}

export function trailDirectionsUrl(stops: TrailStop[], os: typeof Platform.OS = Platform.OS) {
  if (stops.length === 0) {
    throw new Error('A trail needs at least one stop.');
  }

  const places = stops.map(placePin);
  return trailDirectionsUrlFromPlaces(places, os);
}

export async function openTrailDirections(stops: TrailStop[]) {
  const url = trailDirectionsUrl(stops);

  try {
    await Linking.openURL(url);
  } catch {
    // Prefer the web Google Maps place route as a fallback on every platform.
    const places = stops.map(placePin);
    const fallback = googleTrailDirectionsUrlFromPlaces(places);
    if (fallback === url) {
      Alert.alert('Navigation unavailable', `Unable to open this trail in ${mapsAppName()}.`);
      return;
    }

    try {
      await Linking.openURL(fallback);
    } catch {
      Alert.alert('Navigation unavailable', `Unable to open this trail in ${mapsAppName()}.`);
    }
  }
}

export async function openTrailPlaces(places: string[]) {
  const url = trailDirectionsUrlFromPlaces(places);

  try {
    await Linking.openURL(url);
  } catch {
    const fallback = googleTrailDirectionsUrlFromPlaces(places);
    if (fallback === url) {
      Alert.alert('Navigation unavailable', `Unable to open this trail in ${mapsAppName()}.`);
      return;
    }

    try {
      await Linking.openURL(fallback);
    } catch {
      Alert.alert('Navigation unavailable', `Unable to open this trail in ${mapsAppName()}.`);
    }
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
