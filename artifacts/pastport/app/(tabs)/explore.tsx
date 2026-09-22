import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton, Pill, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { station, trail } from '@/data/pastport';

const categories = ['All', 'Nearby', 'Historical Sites', 'People', 'Events', 'Trails'];

export default function ExploreScreen() {
  const [category, setCategory] = useState('All');
  return (
    <ScreenShell>
      <TopBar title="Explore" eyebrow="FIND YOUR NEXT STORY" right={<IconButton name="sliders" onPress={() => undefined} />} />
      <View style={styles.search}><Feather name="search" size={17} color={ui.mutedForeground} /><Text style={styles.searchText}>Search places, people, events</Text><Feather name="mic" size={16} color={ui.accent} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingRight: 8 }}>
        {categories.map((item) => <Pill key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>

      <View style={styles.map}>
        <View style={styles.mapGrid} />
        <View style={[styles.mapRoad, styles.roadOne]} />
        <View style={[styles.mapRoad, styles.roadTwo]} />
        <View style={[styles.mapRoad, styles.roadThree]} />
        <View style={styles.mapLabel}><Text style={styles.mapLabelText}>EAST LONDON</Text><Text style={styles.mapLabelSub}>Heritage district</Text></View>
        <MapMarker left="39%" top="32%" active onPress={() => router.push('/site')} />
        <MapMarker left="66%" top="50%" />
        <MapMarker left="22%" top="62%" />
        <View style={styles.mapControl}><Feather name="crosshair" size={17} color={ui.foreground} /></View>
      </View>

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

function MapMarker({ left, top, active = false, onPress }: { left: string; top: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.marker, { left: left as any, top: top as any }, active && styles.markerActive]}><Feather name="map-pin" size={active ? 17 : 14} color={active ? '#11101A' : ui.primary} /></Pressable>;
}

const styles = StyleSheet.create({
  search: { height: 49, borderRadius: 17, backgroundColor: ui.card, borderWidth: 1, borderColor: ui.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, marginBottom: 16 },
  searchText: { color: ui.mutedForeground, fontSize: 13, flex: 1 },
  categories: { marginBottom: 20 },
  map: { height: 270, borderRadius: 25, backgroundColor: '#11132A', overflow: 'hidden', marginBottom: 25, position: 'relative', borderWidth: 1, borderColor: '#29264B' },
  mapGrid: { ...StyleSheet.absoluteFill, opacity: 0.32, backgroundColor: '#151735' },
  mapRoad: { position: 'absolute', height: 2, backgroundColor: '#47456B', transform: [{ rotate: '33deg' }] },
  roadOne: { width: '115%', top: 110, left: -20 },
  roadTwo: { width: '90%', top: 205, left: 45, transform: [{ rotate: '-17deg' }] },
  roadThree: { width: '100%', top: 55, left: 45, transform: [{ rotate: '-60deg' }] },
  mapLabel: { position: 'absolute', left: 20, bottom: 20 },
  mapLabelText: { color: '#C5BFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  mapLabelSub: { color: '#777696', fontSize: 11, marginTop: 4 },
  marker: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: '#24214B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7E6ACF' },
  markerActive: { backgroundColor: ui.primary, borderColor: ui.primary, width: 42, height: 42, borderRadius: 21, shadowColor: ui.primary, shadowOpacity: 0.8, shadowRadius: 12 },
  mapControl: { position: 'absolute', right: 14, bottom: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: '#24213C', alignItems: 'center', justifyContent: 'center' },
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