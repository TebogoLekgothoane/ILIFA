import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapOverlayControls } from '@/components/MapOverlayControls';
import { ui } from '@/components/PastportUI';
import type { ExploreMapMarker, ExploreMapProps } from '@/components/exploreMapTypes';

function defaultMarkers(coordinates: ExploreMapProps['coordinates'], onOpenSite?: () => void): ExploreMapMarker[] {
  return [
    {
      title: 'East London Railway Station',
      description: 'Walk through its history.',
      coordinate: coordinates,
      onPress: onOpenSite,
      featured: true,
    },
    {
      title: 'Historical Square',
      coordinate: { latitude: coordinates.latitude + 0.008, longitude: coordinates.longitude + 0.007 },
    },
    {
      title: 'Donkin Reserve',
      coordinate: { latitude: coordinates.latitude - 0.006, longitude: coordinates.longitude - 0.009 },
    },
  ];
}

export default function ExploreMap({
  coordinates,
  onOpenSite,
  onLocate,
  onNavigate,
  markers,
  latitudeDelta = 0.045,
  longitudeDelta = 0.045,
  style,
}: ExploreMapProps) {
  const pins = markers ?? defaultMarkers(coordinates, onOpenSite);

  return (
    <View style={[styles.map, style]} collapsable={false}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coordinates, latitudeDelta, longitudeDelta }}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {pins.map((pin) => (
          <Marker
            key={`${pin.title}-${pin.coordinate.latitude}-${pin.coordinate.longitude}`}
            coordinate={pin.coordinate}
            onPress={pin.onPress}
            title={pin.title}
            description={pin.description}
          >
            <View style={pin.featured ? styles.realMarker : styles.smallMarker}>
              <Feather name="map-pin" size={pin.featured ? 17 : 14} color={pin.featured ? '#11101A' : ui.primary} />
            </View>
          </Marker>
        ))}
      </MapView>
      <MapOverlayControls onLocate={onLocate} onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 270, borderRadius: 25, backgroundColor: '#11132A', overflow: 'hidden', marginBottom: 25, position: 'relative', borderWidth: 1, borderColor: '#29264B' },
  realMarker: { width: 42, height: 42, borderRadius: 21, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ui.primary },
  smallMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#24214B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7E6ACF' },
});
