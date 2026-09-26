import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { BookableExperiencesSection } from '@/components/BookableExperiencesSection';
import ExploreMap from '@/components/ExploreMap';
import { PeopleExperiencesSection } from '@/components/PeopleExperiencesSection';
import { IconButton, Pill, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { station, trail } from '@/data/pastport';
import { openDirections } from '@/lib/directions';

const categories = ['All', 'Nearby', 'Heritage Sites', 'Experiences', 'People', 'Events', 'Trails'] as const;
type ExploreCategory = (typeof categories)[number];

const PEOPLE_RADIUS_METERS = 2000;

export default function ExploreScreen() {
  const [category, setCategory] = useState<ExploreCategory>('All');
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  async function useCurrentLocation() {
    const response = permission?.granted ? permission : await requestPermission();
    if (!response.granted) return;
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation(location);
  }

  function openNearbyFilters() {
    setCategory('Nearby');
    void useCurrentLocation();
  }

  const showMap = category !== 'People';
  const showHeritage = category === 'All' || category === 'Nearby' || category === 'Heritage Sites';
  const showPeople = category === 'All' || category === 'Nearby' || category === 'People';
  const showExperiences = category === 'All' || category === 'Nearby' || category === 'Experiences';
  const showTrails = category === 'All' || category === 'Nearby' || category === 'Trails';
  const showEvents = category === 'Events';

  return (
    <ScreenShell>
      <TopBar
        title="Explore"
        eyebrow="FIND YOUR NEXT STORY"
        right={<IconButton name="sliders" onPress={openNearbyFilters} testID="explore-filters" />}
      />
      <View style={styles.search}>
        <Feather name="search" size={17} color={ui.mutedForeground} />
        <Text style={styles.searchText}>Search places, people, experiences</Text>
        <Feather name="mic" size={16} color={ui.accent} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingRight: 8 }}>
        {categories.map((item) => (
          <Pill key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
        ))}
      </ScrollView>

      <View style={styles.locationBar}>
        <View style={styles.locationStatus}>
          <Feather
            name={permission?.granted ? 'navigation' : 'map-pin'}
            size={14}
            color={permission?.granted ? '#78D6A2' : ui.accent}
          />
          <Text style={styles.locationStatusText}>
            {permission?.granted && userLocation
              ? 'Showing your live location'
              : 'Use your live location to find nearby stories'}
          </Text>
        </View>
        <Pressable onPress={useCurrentLocation} testID="explore-enable-gps">
          <Text style={styles.locationAction}>{permission?.granted ? 'Refresh' : 'Enable GPS'}</Text>
        </Pressable>
      </View>

      {showMap ? (
        <ExploreMap
          coordinates={station.coordinates}
          onOpenSite={() => router.push('/site')}
          onLocate={useCurrentLocation}
          onNavigate={() => openDirections(station.coordinates, station.name)}
        />
      ) : null}

      {showHeritage ? (
        <View style={styles.section} testID="explore-heritage-section">
          <SectionHeading title="Heritage sites" action="View map" onAction={() => setCategory('Heritage Sites')} />
          <Pressable style={styles.placeCard} onPress={() => router.push('/site')}>
            <Image source={station.hero} style={styles.placeImage} />
            <View style={styles.placeBody}>
              <View style={styles.placeTop}>
                <Text style={styles.placeTag}>HERITAGE SITE</Text>
                <Feather name="bookmark" size={16} color={ui.mutedForeground} />
              </View>
              <Text style={styles.placeName}>{station.name}</Text>
              <Text style={styles.placeDescription}>{station.description}</Text>
              <View style={styles.placeMeta}>
                <Feather name="navigation" size={12} color={ui.accent} />
                <Text style={styles.placeDistance}>{station.distance}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.placePeriod}>{station.period}</Text>
              </View>
            </View>
          </Pressable>
        </View>
      ) : null}

      {showPeople ? (
        <View style={styles.section} testID="explore-people-section">
          <PeopleExperiencesSection
            siteId={station.id}
            siteName={station.name}
            coordinates={station.coordinates}
            radius={PEOPLE_RADIUS_METERS}
            areaAware
            showMap={category === 'People'}
            showFilters={category === 'People'}
            showSharePrompt={category === 'People'}
            limit={category === 'People' ? undefined : 2}
          />
          {category !== 'People' ? (
            <Pressable testID="explore-people-see-all" onPress={() => setCategory('People')} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all people’s experiences</Text>
              <Feather name="chevron-right" size={16} color={ui.accent} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showExperiences ? (
        <View style={styles.section} testID="explore-experiences-section">
          <BookableExperiencesSection
            limit={category === 'Experiences' ? undefined : 1}
            title={category === 'Experiences' ? 'Experiences near you' : 'Nearby experiences'}
            subtitle={
              category === 'Experiences'
                ? 'Bookable local businesses and guided experiences around this area.'
                : 'What you can do around here.'
            }
          />
          {category !== 'Experiences' ? (
            <Pressable testID="explore-experiences-see-all" onPress={() => setCategory('Experiences')} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all experiences</Text>
              <Feather name="chevron-right" size={16} color={ui.accent} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showTrails ? (
        <View style={styles.section} testID="explore-trails-section">
          <SectionHeading title="Trails" action="See all" onAction={() => router.push('/trails')} />
          <Pressable style={styles.trailRow} onPress={() => router.push('/trail')}>
            <Image source={trail.image} style={styles.trailThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trailLabel}>TRAIL</Text>
              <Text style={styles.trailTitle}>{trail.name}</Text>
              <Text style={styles.trailMeta}>
                {trail.distance} · {trail.stops} locations
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={ui.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      {showEvents ? (
        <View style={styles.section} testID="explore-events-section">
          <SectionHeading title="Events" />
          <View style={styles.emptyCard}>
            <Feather name="calendar" size={18} color={ui.primary} />
            <Text style={styles.emptyTitle}>Local events coming soon</Text>
            <Text style={styles.emptyCopy}>Heritage days, talks, and community gatherings will appear here.</Text>
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 49,
    borderRadius: 17,
    backgroundColor: ui.card,
    borderWidth: 1,
    borderColor: ui.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 16,
  },
  searchText: { color: ui.mutedForeground, fontSize: 13, flex: 1 },
  categories: { marginBottom: 20 },
  locationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#17152D',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  locationStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locationStatusText: { color: ui.mutedForeground, fontSize: 11 },
  locationAction: { color: ui.accent, fontSize: 11, fontWeight: '700' },
  section: { marginBottom: 22 },
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
  trailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: ui.card,
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  trailThumb: { width: 62, height: 62, borderRadius: 15 },
  trailLabel: { color: ui.accent, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' },
  trailTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700', marginTop: 4 },
  trailMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 4 },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 4,
  },
  seeAllText: { color: ui.accent, fontSize: 12, fontWeight: '700' },
  emptyCard: {
    backgroundColor: ui.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: ui.border,
    gap: 8,
  },
  emptyTitle: { color: ui.foreground, fontSize: 15, fontWeight: '700' },
  emptyCopy: { color: ui.mutedForeground, fontSize: 12, lineHeight: 18 },
});
