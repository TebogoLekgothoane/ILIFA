import type { ImageSourcePropType } from 'react-native';
import stationHero from '@/assets/images/station-hero.jpg';
import station1920 from '@/assets/images/station-1920.jpg';
import trailHero from '@/assets/images/trail-hero.jpg';
import { station, type MapCoordinate } from '@/data/pastport';

export type BookableExperience = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  duration: string;
  priceLabel: string;
  priceZar: number;
  rating: number;
  reviewCount: number;
  image: ImageSourcePropType;
  featuredPartner?: boolean;
  coordinates: MapCoordinate;
  siteId?: string;
  hostName: string;
  hostRole: string;
  meetingPoint: string;
  languages: string[];
  maxGuests: number;
  includes: string[];
  highlights: string[];
  cancellation: string;
};

export const bookableExperiences: BookableExperience[] = [
  {
    id: 'heritage-walking-tour',
    name: 'East London Heritage Walking Tour',
    tagline: 'Guided heritage experience',
    description:
      'Walk from East London Railway Station through the harbour edge and civic streets with a local guide who connects architecture, arrivals, and living memory. Designed for visitors who want more than a checklist.',
    category: 'Walking tour',
    duration: '2 hours',
    priceLabel: 'R500',
    priceZar: 500,
    rating: 4.8,
    reviewCount: 126,
    image: stationHero,
    featuredPartner: true,
    coordinates: {
      latitude: station.coordinates.latitude + 0.0012,
      longitude: station.coordinates.longitude - 0.0008,
    },
    siteId: station.id,
    hostName: 'Thabo & Co. Heritage Walks',
    hostRole: 'Local guide collective',
    meetingPoint: 'Main entrance, East London Railway Station',
    languages: ['English', 'isiXhosa'],
    maxGuests: 12,
    includes: ['Licensed local guide', 'Printed route map', 'Light refreshment stop'],
    highlights: ['Station arrival hall', 'Harbour approach', 'Community memory stops'],
    cancellation: 'Free cancellation up to 24 hours before the start time.',
  },
  {
    id: 'cultural-experience',
    name: 'East London Cultural Experience',
    tagline: 'Local food, music, and memory',
    description:
      'A slower afternoon with community hosts — tasting, listening, and hearing how this city remembers itself. Ideal after exploring a heritage site with ILIFA.',
    category: 'Culture',
    duration: '3 hours',
    priceLabel: 'R350',
    priceZar: 350,
    rating: 4.7,
    reviewCount: 84,
    image: trailHero,
    coordinates: {
      latitude: station.coordinates.latitude - 0.0024,
      longitude: station.coordinates.longitude + 0.0016,
    },
    siteId: station.id,
    hostName: 'Imbizo Collective',
    hostRole: 'Community cultural hosts',
    meetingPoint: 'Outside the station bookshop',
    languages: ['English', 'isiXhosa', 'Afrikaans'],
    maxGuests: 10,
    includes: ['Host-led tasting', 'Live acoustic set', 'Community story circle'],
    highlights: ['Local flavours', 'Oral history', 'Small-group welcome'],
    cancellation: 'Free cancellation up to 48 hours before the start time.',
  },
  {
    id: 'photography-tour',
    name: 'Local Photography Tour',
    tagline: 'Capture the station, harbour, and streets',
    description:
      'A guided photo walk for travellers and locals who want composed frames of East London’s railway, waterfront, and side streets — with tips for light, framing, and respectful storytelling.',
    category: 'Photography',
    duration: '2.5 hours',
    priceLabel: 'R750',
    priceZar: 750,
    rating: 4.9,
    reviewCount: 61,
    image: station1920,
    coordinates: {
      latitude: station.coordinates.latitude + 0.0031,
      longitude: station.coordinates.longitude + 0.0022,
    },
    siteId: station.id,
    hostName: 'Lindiwe Lens',
    hostRole: 'Documentary photographer',
    meetingPoint: 'Station clock concourse',
    languages: ['English'],
    maxGuests: 6,
    includes: ['Photography coaching', 'Curated shooting locations', 'Edited highlight tip sheet'],
    highlights: ['Golden-hour station facade', 'Harbour lines', 'Street texture'],
    cancellation: 'Free cancellation up to 24 hours before the start time.',
  },
];
