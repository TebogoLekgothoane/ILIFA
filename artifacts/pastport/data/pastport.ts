import stationHero from '@/assets/images/station-hero.jpg';
import station1920 from '@/assets/images/station-1920.jpg';
import trailHero from '@/assets/images/trail-hero.jpg';

export type Period = {
  year: number;
  label: string;
  caption: string;
};

export type SiteObject = {
  id: string;
  title: string;
  type: string;
  description: string;
  date: string;
  source: string;
  significance: string;
  x: number;
  y: number;
};

export const periods: Period[] = [
  { year: 2026, label: 'Today', caption: 'The station as it stands now.' },
  { year: 1950, label: '1950', caption: 'A busy post-war rail junction.' },
  { year: 1920, label: '1920', caption: 'Steam, stories, and a city in motion.' },
];

export const station = {
  id: 'east-london-station',
  name: 'East London Railway Station',
  area: 'East London, Eastern Cape',
  distance: '1.2 km away',
  period: '1880 — present',
  description:
    'Walk through the story of a station that connected a growing coastal city to the wider country.',
  hero: stationHero,
  reconstruction: station1920,
  coordinates: { latitude: -33.0153, longitude: 27.9116 },
  objects: [
    {
      id: 'steam-locomotive',
      title: 'Steam locomotive',
      type: 'Vehicle',
      description:
        'A period reconstruction of the steam locomotives that carried passengers and goods through the Eastern Cape.',
      date: 'c. 1920',
      source: 'PASTPORT demo archive',
      significance: 'Rail made the port city part of a much larger story.',
      x: 19,
      y: 53,
    },
    {
      id: 'station-arch',
      title: 'Station arch',
      type: 'Architecture',
      description:
        'The grand entry arch is used here as an AI-generated reconstruction based on available historical references.',
      date: 'c. 1920',
      source: 'PASTPORT demo archive',
      significance: 'The arrival hall shaped how visitors first experienced the city.',
      x: 54,
      y: 31,
    },
    {
      id: 'platform-traveller',
      title: 'Platform traveller',
      type: 'Person',
      description:
        'A reconstructed traveller represents the thousands of journeys that passed through this station.',
      date: 'c. 1920',
      source: 'AI reconstruction',
      significance: 'Every platform held a different reason to leave, arrive, or wait.',
      x: 74,
      y: 46,
    },
  ] satisfies SiteObject[],
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type Province = {
  name: string;
  coordinates: MapCoordinate;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type HeritagePlace = {
  id: string;
  name: string;
  province: string;
  coordinates: MapCoordinate;
  era: string;
  type: string;
  image: typeof stationHero;
};

export type SavedPhotograph = {
  id: string;
  title: string;
  placeName: string;
  year: string;
  image: typeof stationHero;
};

export const provinces: Province[] = [
  { name: 'Eastern Cape', coordinates: { latitude: -32.2, longitude: 26.3 }, latitudeDelta: 5.2, longitudeDelta: 5.6 },
  { name: 'Western Cape', coordinates: { latitude: -33.2, longitude: 20.8 }, latitudeDelta: 4.2, longitudeDelta: 5 },
  { name: 'Northern Cape', coordinates: { latitude: -29.6, longitude: 21.4 }, latitudeDelta: 6.4, longitudeDelta: 6.2 },
  { name: 'Free State', coordinates: { latitude: -28.6, longitude: 26.8 }, latitudeDelta: 3.2, longitudeDelta: 3.4 },
  { name: 'KwaZulu-Natal', coordinates: { latitude: -28.8, longitude: 30.6 }, latitudeDelta: 3.4, longitudeDelta: 2.8 },
  { name: 'Gauteng', coordinates: { latitude: -26.15, longitude: 28.05 }, latitudeDelta: 0.9, longitudeDelta: 1 },
  { name: 'North West', coordinates: { latitude: -26.6, longitude: 25.6 }, latitudeDelta: 3.2, longitudeDelta: 3.4 },
  { name: 'Mpumalanga', coordinates: { latitude: -25.6, longitude: 30.4 }, latitudeDelta: 2.8, longitudeDelta: 2.6 },
  { name: 'Limpopo', coordinates: { latitude: -23.6, longitude: 29.4 }, latitudeDelta: 3.8, longitudeDelta: 3.4 },
];

export const places: HeritagePlace[] = [
  {
    id: station.id,
    name: station.name,
    province: 'Eastern Cape',
    coordinates: station.coordinates,
    era: '1920',
    type: 'Historical site',
    image: station.hero,
  },
  {
    id: 'fort-glamorgan',
    name: 'Fort Glamorgan',
    province: 'Eastern Cape',
    coordinates: { latitude: -33.03012, longitude: 27.90396 },
    era: '1847',
    type: 'Fort',
    image: trailHero,
  },
  {
    id: 'east-london-museum',
    name: 'East London Museum',
    province: 'Eastern Cape',
    coordinates: { latitude: -32.99591, longitude: 27.89539 },
    era: 'Present',
    type: 'Museum',
    image: station1920,
  },
  {
    id: 'castle-of-good-hope',
    name: 'Castle of Good Hope',
    province: 'Western Cape',
    coordinates: { latitude: -33.9258, longitude: 18.4276 },
    era: '1666',
    type: 'Fort',
    image: trailHero,
  },
  {
    id: 'robben-island',
    name: 'Robben Island',
    province: 'Western Cape',
    coordinates: { latitude: -33.8067, longitude: 18.3662 },
    era: '1960s',
    type: 'World Heritage Site',
    image: station1920,
  },
  {
    id: 'union-buildings',
    name: 'Union Buildings',
    province: 'Gauteng',
    coordinates: { latitude: -25.7403, longitude: 28.2119 },
    era: '1913',
    type: 'Civic landmark',
    image: station.hero,
  },
  {
    id: 'constitution-hill',
    name: 'Constitution Hill',
    province: 'Gauteng',
    coordinates: { latitude: -26.1887, longitude: 28.0426 },
    era: '1893',
    type: 'Heritage precinct',
    image: trailHero,
  },
  {
    id: 'ulundi-battlefield',
    name: 'Ulundi Battlefield',
    province: 'KwaZulu-Natal',
    coordinates: { latitude: -28.335, longitude: 31.416 },
    era: '1879',
    type: 'Battlefield',
    image: station1920,
  },
];

/** Demo archive seeded on first launch when local storage is empty. */
export const mockVisitedSiteIds = [
  station.id,
  'fort-glamorgan',
  'castle-of-good-hope',
  'union-buildings',
  'ulundi-battlefield',
];

export const mockSavedSiteIds = [station.id, 'robben-island', 'constitution-hill'];

export const mockPhotographs: SavedPhotograph[] = [
  {
    id: 'photo-station-hall',
    title: 'Arrival hall light',
    placeName: station.name,
    year: '1920',
    image: station.hero,
  },
  {
    id: 'photo-platform',
    title: 'Steam on the platform',
    placeName: station.name,
    year: '1920',
    image: station1920,
  },
  {
    id: 'photo-harbour',
    title: 'Harbour edge walk',
    placeName: 'Latimer’s Landing',
    year: '1938',
    image: trailHero,
  },
];

export function placesByIds(ids: string[]): HeritagePlace[] {
  const byId = new Map(places.map((place) => [place.id, place]));
  return ids.map((id) => byId.get(id)).filter((place): place is HeritagePlace => Boolean(place));
}

export const trail = {
  id: 'east-london-heritage-trail',
  name: 'East London Heritage Trail',
  duration: '4 hours',
  distance: '6.8 km',
  stops: 8,
  description:
    'A self-guided walk through the city’s railway, civic, and coastal histories.',
  image: trailHero,
  locations: [
    {
      name: 'Railway Station',
      time: 'Start here',
      period: '1920',
      done: true,
      coordinates: station.coordinates,
      placeQuery: 'East London Railway Station, Station Street, East London, South Africa',
    },
    {
      name: 'Historical Square',
      time: '12 min walk',
      period: '1910',
      done: true,
      coordinates: { latitude: -33.01474, longitude: 27.90418 },
      placeQuery: 'City Hall, Oxford Street, East London, South Africa',
    },
    {
      name: "Latimer's Landing",
      time: '18 min walk',
      period: '1938',
      done: true,
      coordinates: { latitude: -33.02201, longitude: 27.89522 },
      placeQuery: "Latimer's Landing, East London Harbour, South Africa",
    },
    {
      name: 'Fort Glamorgan',
      time: '25 min walk',
      period: '1847',
      done: false,
      coordinates: { latitude: -33.03012, longitude: 27.90396 },
      placeQuery: 'Fort Glamorgan, East London, South Africa',
    },
    {
      name: 'East London Museum',
      time: '20 min walk',
      period: 'Present',
      done: false,
      coordinates: { latitude: -32.99591, longitude: 27.89539 },
      placeQuery: 'East London Museum, Upper Oxford Street, East London, South Africa',
    },
  ],
};

/** Hardcoded Google/Apple Maps place strings for the heritage walking route. */
export const heritageTrailMapPlaces = trail.locations.map((location) => location.placeQuery);

export const moreTrails = [
  {
    id: 'rail-and-industry',
    title: 'Rail & Industry',
    meta: '2.4 km · 5 places',
    icon: 'truck' as const,
    description: 'Follow the goods yards and industrial edge of the port city.',
    mapPlaces: [
      'East London Railway Station, Station Street, East London, South Africa',
      'East London Harbour, Quigney, East London, South Africa',
      "Latimer's Landing, East London Harbour, South Africa",
      'Fort Glamorgan, East London, South Africa',
      'East London Museum, Upper Oxford Street, East London, South Africa',
    ],
  },
  {
    id: 'coastal-stories',
    title: 'Coastal Stories',
    meta: '3.1 km · 6 places',
    icon: 'wind' as const,
    description: 'A harbour-to-beach walk through East London’s coastal memory.',
    mapPlaces: [
      "Latimer's Landing, East London Harbour, South Africa",
      'Orient Beach, East London, South Africa',
      'Eastern Beach, East London, South Africa',
      'Nahoon Beach, East London, South Africa',
      'East London Museum, Upper Oxford Street, East London, South Africa',
    ],
  },
];

export const badges = [
  { title: 'FIRST STEP', description: 'Visited your first historical site.', earned: true },
  { title: 'TIME TRAVELER', description: 'Experienced three historical periods.', earned: true },
  { title: 'HISTORY EXPLORER', description: 'Completed your first heritage trail.', earned: false },
  { title: 'LOCAL LEGEND', description: 'Visited ten historical locations.', earned: false },
];