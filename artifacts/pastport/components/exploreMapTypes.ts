import type { StyleProp, ViewStyle } from 'react-native';
import type { MapCoordinate } from '@/data/pastport';

export type ExploreMapMarker = {
  title: string;
  description?: string;
  coordinate: MapCoordinate;
  onPress?: () => void;
  featured?: boolean;
};

export type ExploreMapProps = {
  coordinates: MapCoordinate;
  onOpenSite?: () => void;
  onLocate?: () => void;
  markers?: ExploreMapMarker[];
  latitudeDelta?: number;
  longitudeDelta?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};
