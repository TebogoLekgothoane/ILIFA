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
    { name: 'Railway Station', time: 'Start here', period: '1920', done: true },
    { name: 'Historical Square', time: '12 min walk', period: '1910', done: true },
    { name: 'Donkin Reserve', time: '18 min walk', period: '1820', done: true },
    { name: 'Fort Glamorgan', time: '25 min walk', period: '1847', done: false },
    { name: 'East London Museum', time: '20 min walk', period: 'Present', done: false },
  ],
};

export const badges = [
  { title: 'FIRST STEP', description: 'Visited your first historical site.', earned: true },
  { title: 'TIME TRAVELER', description: 'Experienced three historical periods.', earned: true },
  { title: 'HISTORY EXPLORER', description: 'Completed your first heritage trail.', earned: false },
  { title: 'LOCAL LEGEND', description: 'Visited ten historical locations.', earned: false },
];