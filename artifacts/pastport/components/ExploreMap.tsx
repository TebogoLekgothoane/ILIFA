import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';
import type { ExploreMapMarker, ExploreMapProps } from '@/components/exploreMapTypes';
import type { MapCoordinate } from '@/data/pastport';

function percent(value: number): `${number}%` {
  return `${value}%` as `${number}%`;
}

function pinPosition(coordinate: MapCoordinate, center: MapCoordinate, latitudeDelta: number, longitudeDelta: number) {
  const left = ((coordinate.longitude - (center.longitude - longitudeDelta / 2)) / longitudeDelta) * 100;
  const top = ((center.latitude + latitudeDelta / 2 - coordinate.latitude) / latitudeDelta) * 100;
  return {
    left: percent(Math.min(88, Math.max(6, left))),
    top: percent(Math.min(82, Math.max(8, top))),
  };
}

function MarkerPin({ marker, position }: { marker: ExploreMapMarker; position: { left: `${number}%`; top: `${number}%` } }) {
  const pinStyle = [styles.marker, marker.featured && styles.markerActive, position];
  const icon = <Feather name="map-pin" size={marker.featured ? 17 : 14} color={marker.featured ? '#11101A' : ui.primary} />;
  if (!marker.onPress) return <View style={pinStyle}>{icon}</View>;
  return (
    <Pressable onPress={marker.onPress} style={pinStyle}>
      {icon}
    </Pressable>
  );
}

export default function ExploreMap({
  coordinates,
  onOpenSite,
  onLocate,
  markers,
  latitudeDelta = 0.045,
  longitudeDelta = 0.045,
  label = 'EAST LONDON',
  style,
}: ExploreMapProps) {
  const customMarkers = markers !== undefined;

  return (
    <View style={[styles.map, style]}>
      <View style={styles.mapGrid} />
      <View style={[styles.mapRoad, styles.roadOne]} />
      <View style={[styles.mapRoad, styles.roadTwo]} />
      <View style={[styles.mapRoad, styles.roadThree]} />
      <Text style={styles.coordinate}>
        LIVE COORDINATES{'\n'}
        {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
      </Text>
      {customMarkers ? (
        markers.map((marker) => (
          <MarkerPin
            key={`${marker.title}-${marker.coordinate.latitude}`}
            marker={marker}
            position={pinPosition(marker.coordinate, coordinates, latitudeDelta, longitudeDelta)}
          />
        ))
      ) : (
        <>
          <Pressable onPress={onOpenSite} style={[styles.marker, styles.markerActive, { left: '39%', top: '32%' }]}>
            <Feather name="map-pin" size={17} color="#11101A" />
          </Pressable>
          <View style={[styles.marker, { left: '66%', top: '50%' }]}>
            <Feather name="map-pin" size={14} color={ui.primary} />
          </View>
          <View style={[styles.marker, { left: '22%', top: '62%' }]}>
            <Feather name="map-pin" size={14} color={ui.primary} />
          </View>
        </>
      )}
      <View style={styles.mapLabel}>
        <Text style={styles.mapLabelText}>{label}</Text>
        <Text style={styles.mapLabelSub}>
          {customMarkers && markers.length === 0 ? 'No places visited here yet' : 'Web preview · native map available on device'}
        </Text>
      </View>
      {onLocate ? (
        <Pressable onPress={onLocate} style={styles.mapControl}>
          <Feather name="crosshair" size={17} color={ui.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 270, borderRadius: 25, backgroundColor: '#11132A', overflow: 'hidden', marginBottom: 25, position: 'relative', borderWidth: 1, borderColor: '#29264B' },
  mapGrid: { ...StyleSheet.absoluteFill, opacity: 0.32, backgroundColor: '#151735' },
  mapRoad: { position: 'absolute', height: 2, backgroundColor: '#47456B' },
  roadOne: { width: '115%', top: 110, left: -20, transform: [{ rotate: '33deg' }] },
  roadTwo: { width: '90%', top: 205, left: 45, transform: [{ rotate: '-17deg' }] },
  roadThree: { width: '100%', top: 55, left: 45, transform: [{ rotate: '-60deg' }] },
  coordinate: { position: 'absolute', top: 18, right: 17, color: '#777696', fontSize: 8, lineHeight: 13, textAlign: 'right', letterSpacing: 0.5 },
  mapLabel: { position: 'absolute', left: 20, bottom: 20 },
  mapLabelText: { color: '#C5BFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  mapLabelSub: { color: '#777696', fontSize: 10, marginTop: 4 },
  marker: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: '#24214B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7E6ACF' },
  markerActive: { backgroundColor: ui.primary, borderColor: ui.primary, width: 42, height: 42, borderRadius: 21, shadowColor: ui.primary, shadowOpacity: 0.8, shadowRadius: 12 },
  mapControl: { position: 'absolute', right: 14, bottom: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: '#24213C', alignItems: 'center', justifyContent: 'center' },
});
