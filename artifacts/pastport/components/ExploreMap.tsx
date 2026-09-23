import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

type ExploreMapProps = {
  coordinates: { latitude: number; longitude: number };
  onOpenSite: () => void;
  onLocate: () => void;
};

export default function ExploreMap({ coordinates, onOpenSite, onLocate }: ExploreMapProps) {
  return (
    <View style={styles.map}>
      <View style={styles.mapGrid} />
      <View style={[styles.mapRoad, styles.roadOne]} />
      <View style={[styles.mapRoad, styles.roadTwo]} />
      <View style={[styles.mapRoad, styles.roadThree]} />
      <Text style={styles.coordinate}>LIVE COORDINATES{'\n'}{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</Text>
      <Pressable onPress={onOpenSite} style={[styles.marker, styles.markerActive, { left: '39%', top: '32%' }]}>
        <Feather name="map-pin" size={17} color="#11101A" />
      </Pressable>
      <View style={[styles.marker, { left: '66%', top: '50%' }]}><Feather name="map-pin" size={14} color={ui.primary} /></View>
      <View style={[styles.marker, { left: '22%', top: '62%' }]}><Feather name="map-pin" size={14} color={ui.primary} /></View>
      <View style={styles.mapLabel}><Text style={styles.mapLabelText}>EAST LONDON</Text><Text style={styles.mapLabelSub}>Web preview · native map available on device</Text></View>
      <Pressable onPress={onLocate} style={styles.mapControl}><Feather name="crosshair" size={17} color={ui.foreground} /></Pressable>
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