import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ui } from '@/components/PastportUI';

type ExploreMapProps = {
  coordinates: { latitude: number; longitude: number };
  onOpenSite: () => void;
  onLocate: () => void;
};

export default function ExploreMap({ coordinates, onOpenSite, onLocate }: ExploreMapProps) {
  return (
    <View style={styles.map}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coordinates, latitudeDelta: 0.045, longitudeDelta: 0.045 }}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        <Marker coordinate={coordinates} onPress={onOpenSite} title="East London Railway Station" description="Walk through its history.">
          <View style={styles.realMarker}><Feather name="map-pin" size={17} color="#11101A" /></View>
        </Marker>
        <Marker coordinate={{ latitude: coordinates.latitude + 0.008, longitude: coordinates.longitude + 0.007 }} title="Historical Square">
          <View style={styles.smallMarker}><Feather name="map-pin" size={14} color={ui.primary} /></View>
        </Marker>
        <Marker coordinate={{ latitude: coordinates.latitude - 0.006, longitude: coordinates.longitude - 0.009 }} title="Donkin Reserve">
          <View style={styles.smallMarker}><Feather name="map-pin" size={14} color={ui.primary} /></View>
        </Marker>
      </MapView>
      <Pressable onPress={onLocate} style={styles.mapControl}><Feather name="crosshair" size={17} color={ui.foreground} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 270, borderRadius: 25, backgroundColor: '#11132A', overflow: 'hidden', marginBottom: 25, position: 'relative', borderWidth: 1, borderColor: '#29264B' },
  realMarker: { width: 42, height: 42, borderRadius: 21, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ui.primary },
  smallMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#24214B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7E6ACF' },
  mapControl: { position: 'absolute', right: 14, bottom: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: '#24213C', alignItems: 'center', justifyContent: 'center' },
});