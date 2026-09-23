import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { IconButton, Pill, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { station, trail } from '@/data/pastport';
import ExploreMap from '@/components/ExploreMap';

const categories = ['All', 'Nearby', 'Historical Sites', 'People', 'Events', 'Trails'];

export default function ExploreScreen() {
  const [category, setCategory] = useState('All');
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  async function useCurrentLocation() {
    const response = permission?.granted ? permission : await requestPermission();
    if (!response.granted) return;
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation(location);
  }

  return (
    <ScreenShell>
      <TopBar title="Explore" eyebrow="FIND YOUR NEXT STORY" right={<IconButton name="sliders" onPress={() => undefined} />} />
      <View style={styles.search}><Feather name="search" size={17} color={ui.mutedForeground} /><Text style={styles.searchText}>Search places, people, events</Text><Feather name="mic" size={16} color={ui.accent} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingRight: 8 }}>
        {categories.map((item) => <Pill key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>

      <View style={styles.locationBar}><View style={styles.locationStatus}><Feather name={permission?.granted ? 'navigation' : 'map-pin'} size={14} color={permission?.granted ? '#78D6A2' : ui.accent} /><Text style={styles.locationStatusText}>{permission?.granted && userLocation ? 'Showing your live location' : 'Use your live location to find nearby stories'}</Text></View><Pressable onPress={useCurrentLocation}><Text style={styles.locationAction}>{permission?.granted ? 'Refresh' : 'Enable GPS'}</Text></Pressable></View>
      <ExploreMap coordinates={station.coordinates} onOpenSite={() => router.push('/site')} onLocate={useCurrentLocation} />

      <SectionHeading title="Stories near you" action="List view" onAction={() => undefined} />
      <Pressable style={styles.placeCard} onPress={() => router.push('/site')}>
        <Image source={station.hero} style={styles.placeImage} />
        <View style={styles.placeBody}>
          <View style={styles.placeTop}><Text style={styles.placeTag}>HISTORICAL SITE</Text><Feather name="bookmark" size={16} color={ui.mutedForeground} /></View>
          <Text style={styles.placeName}>{station.name}</Text>
          <Text style={styles.placeDescription}>{station.description}</Text>
          <View style={styles.placeMeta}><Feather name="navigation" size={12} color={ui.accent} /><Text style={styles.placeDistance}>{station.distance}</Text><Text style={styles.dot}>•</Text><Text style={styles.placePeriod}>{station.period}</Text></View>
        </View>
      </Pressable>
      <Pressable style={styles.trailRow} onPress={() => router.push('/trail')}>
        <Image source={trail.image} style={styles.trailThumb} />
        <View style={{ flex: 1 }}><Text style={styles.trailLabel}>TRAIL</Text><Text style={styles.trailTitle}>{trail.name}</Text><Text style={styles.trailMeta}>{trail.distance} · {trail.stops} locations</Text></View>
        <Feather name="chevron-right" size={18} color={ui.mutedForeground} />
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  search: { height: 49, borderRadius: 17, backgroundColor: ui.card, borderWidth: 1, borderColor: ui.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 16 },
  searchText: { color: ui.mutedForeground, fontSize: 13, flex: 1 },
  categories: { marginBottom: 20 },
  locationBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#17152D', marginBottom: 12, borderWidth: 1, borderColor: ui.border },
  locationStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locationStatusText: { color: ui.mutedForeground, fontSize: 11 },
  locationAction: { color: ui.accent, fontSize: 11, fontWeight: '700' },
  placeCard: { borderRadius: 23, overflow: 'hidden', backgroundColor: ui.card, marginBottom: 13 },
  placeImage: { width: '100%', height: 164 },
  placeBody: { padding: 16 },
  placeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placeTag: { color: ui.accent, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' },
  placeName: { color: ui.foreground, fontSize: 17, fontWeight: '700', marginTop: 10 },
  placeDescription: { color: ui.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 6 },
  placeMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  placeDistance: { color: ui.foreground, fontSize: 11, fontWeight: '600' },
  dot: { color: ui.mutedForeground },
  placePeriod: { color: ui.mutedForeground, fontSize: 11 },
  trailRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: ui.card, padding: 10, borderRadius: 20, marginBottom: 20 },
  trailThumb: { width: 62, height: 62, borderRadius: 15 },
  trailLabel: { color: ui.accent, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' },
  trailTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700', marginTop: 4 },
  trailMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 4 },
});