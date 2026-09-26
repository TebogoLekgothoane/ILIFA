import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ExploreMap from '@/components/ExploreMap';
import { Pill, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { usePastport } from '@/context/PastportContext';
import { mockPhotographs, placesByIds, provinces } from '@/data/pastport';
import { provinceWithVisits, regionForPlaces, visitedPlacesInProvince } from '@/lib/visitedPlaces';

export default function SavedScreen() {
  const { savedSites, visitedSites, toggleSaved } = usePastport();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [editingSaved, setEditingSaved] = useState(false);
  const provinceName = selectedProvince ?? provinceWithVisits(visitedSites) ?? provinces[0].name;
  const province = provinces.find((item) => item.name === provinceName) ?? provinces[0];
  const visited = visitedPlacesInProvince(visitedSites, province.name);
  const savedPlaces = placesByIds(savedSites);
  const region = regionForPlaces(
    visited.map((place) => place.coordinates),
    province,
  );

  function openPlace() {
    router.push('/site');
  }

  return (
    <ScreenShell>
      <TopBar title="Saved" eyebrow="YOUR PERSONAL ARCHIVE" right={<Feather name="bookmark" size={21} color={ui.accent} />} />
      <View style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <View>
            <Text style={styles.journeyEyebrow}>MY JOURNEY</Text>
            <Text style={styles.journeyTitle}>A map of your stories</Text>
          </View>
          <View style={styles.journeyCount}>
            <Text style={styles.countText}>{visitedSites.length || 0}</Text>
            <Text style={styles.countLabel}>visited</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.provinces} contentContainerStyle={styles.provinceRow}>
          {provinces.map((item) => {
            const count = visitedPlacesInProvince(visitedSites, item.name).length;
            return (
              <Pill
                key={item.name}
                label={count > 0 ? `${item.name} · ${count}` : item.name}
                active={item.name === province.name}
                onPress={() => setSelectedProvince(item.name)}
              />
            );
          })}
        </ScrollView>
        <ExploreMap
          key={`${province.name}:${visited.map((place) => place.id).join(',')}`}
          coordinates={{ latitude: region.latitude, longitude: region.longitude }}
          latitudeDelta={region.latitudeDelta}
          longitudeDelta={region.longitudeDelta}
          label={province.name.toUpperCase()}
          style={styles.journeyMap}
          markers={visited.map((place) => ({
            title: place.name,
            description: place.province,
            coordinate: place.coordinates,
            featured: true,
            onPress: openPlace,
          }))}
        />
        {visited.length === 0 ? (
          <Text style={styles.journeyEmpty}>Visit a place in {province.name} and it will show up here.</Text>
        ) : (
          visited.map((place) => (
            <Pressable key={place.id} style={styles.visitRow} onPress={openPlace}>
              <Feather name="map-pin" size={14} color={ui.accent} />
              <View style={styles.visitCopy}>
                <Text style={styles.visitName}>{place.name}</Text>
                <Text style={styles.visitMeta}>{place.era} · {place.type}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={ui.mutedForeground} />
            </Pressable>
          ))
        )}
      </View>
      <SectionHeading
        title="Saved experiences"
        action={editingSaved ? 'Done' : 'Edit'}
        onAction={() => setEditingSaved((current) => !current)}
      />
      {savedPlaces.length > 0 ? (
        savedPlaces.map((place) => (
          <Pressable key={place.id} style={styles.savedRow} onPress={openPlace}>
            <Image source={place.image} style={styles.savedImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.savedTitle}>{place.name}</Text>
              <Text style={styles.savedMeta}>{place.era} · {place.type}</Text>
            </View>
            {editingSaved ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${place.name}`}
                hitSlop={8}
                onPress={() => toggleSaved(place.id)}
                style={styles.removeButton}
              >
                <Feather name="trash-2" size={16} color="#E8A0A0" />
              </Pressable>
            ) : (
              <Feather name="chevron-right" size={17} color={ui.mutedForeground} />
            )}
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="bookmark" size={20} color={ui.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your archive is waiting</Text>
          <Text style={styles.emptyCopy}>Save places, stories, and trails as you explore.</Text>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.emptyAction}>Explore places</Text>
          </Pressable>
        </View>
      )}
      <SectionHeading title="Your photographs" />
      {mockPhotographs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {mockPhotographs.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={photo.image} style={styles.photoImage} />
              <Text style={styles.photoTitle}>{photo.title}</Text>
              <Text style={styles.photoMeta}>{photo.placeName} · {photo.year}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.photoEmpty}>
          <Feather name="image" size={19} color={ui.mutedForeground} />
          <Text style={styles.photoText}>Historical photographs you save will appear here.</Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  journeyCard: { backgroundColor: '#16152D', borderRadius: 24, padding: 17, borderWidth: 1, borderColor: '#2B2749', marginBottom: 28 },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  journeyEyebrow: { color: ui.accent, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  journeyTitle: { color: ui.foreground, fontSize: 17, fontWeight: '700', marginTop: 6 },
  journeyCount: { alignItems: 'flex-end' },
  countText: { color: ui.foreground, fontSize: 26, fontWeight: '700' },
  countLabel: { color: ui.mutedForeground, fontSize: 10 },
  provinces: { marginTop: 16 },
  provinceRow: { paddingRight: 8 },
  journeyMap: { height: 240, marginTop: 14, marginBottom: 12 },
  journeyEmpty: { color: ui.mutedForeground, fontSize: 12, lineHeight: 18 },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  visitCopy: { flex: 1 },
  visitName: { color: ui.foreground, fontSize: 13, fontWeight: '700' },
  visitMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 2 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: ui.card, padding: 10, borderRadius: 20, marginBottom: 12 },
  savedImage: { width: 62, height: 62, borderRadius: 15 },
  savedTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  savedMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 5 },
  removeButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#2A1F33', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', backgroundColor: ui.card, padding: 27, borderRadius: 22, marginBottom: 27 },
  emptyIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#24203E', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: ui.foreground, fontSize: 15, fontWeight: '700' },
  emptyCopy: { color: ui.mutedForeground, fontSize: 12, marginTop: 6, textAlign: 'center' },
  emptyAction: { color: ui.accent, fontSize: 12, fontWeight: '700', marginTop: 15 },
  photoRow: { gap: 12, paddingRight: 8, marginBottom: 8 },
  photoCard: { width: 148 },
  photoImage: { width: 148, height: 110, borderRadius: 16, marginBottom: 8 },
  photoTitle: { color: ui.foreground, fontSize: 12, fontWeight: '700' },
  photoMeta: { color: ui.mutedForeground, fontSize: 10, marginTop: 3 },
  photoEmpty: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, backgroundColor: ui.card, borderRadius: 18 },
  photoText: { color: ui.mutedForeground, fontSize: 12, flex: 1 },
});
