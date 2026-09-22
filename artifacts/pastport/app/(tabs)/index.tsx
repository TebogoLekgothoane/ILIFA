import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { station, trail } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';
import { HeroImage, IconButton, PrimaryButton, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { visitedSites } = usePastport();
  return (
    <ScreenShell contentStyle={{ paddingTop: insets.top + 8 }}>
      <TopBar
        eyebrow="YOUR NEXT CHAPTER"
        right={<IconButton name="bell" onPress={() => undefined} />}
      />
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Welcome to PASTPORT</Text>
        <Text style={styles.welcomeCopy}>History is closer than you think.</Text>
      </View>

      <HeroImage image={station.hero} height={425} style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>NEARBY EXPERIENCE</Text>
          </View>
          <Text style={styles.heroTitle}>SEE THE{'\n'}PAST</Text>
          <Text style={styles.heroSubtitle}>Stand where history happened.</Text>
          <PrimaryButton
            label="Explore nearby"
            icon="arrow-up-right"
            onPress={() => router.push('/experience')}
            testID="home-explore-nearby"
          />
        </View>
      </HeroImage>

      <View style={styles.section}>
        <SectionHeading title="Nearby historical places" action="View map" onAction={() => router.push('/explore')} />
        <Pressable style={styles.nearbyRow} onPress={() => router.push('/site')}>
          <Image source={station.hero} style={styles.nearbyImage} />
          <View style={styles.nearbyText}>
            <Text style={styles.nearbyName}>{station.name}</Text>
            <Text style={styles.nearbyDescription}>Walk through its history.</Text>
            <View style={styles.locationLine}>
              <Feather name="navigation" size={12} color={ui.accent} />
              <Text style={styles.locationText}>{station.distance} · 1920 ready</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={ui.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Continue your journey" />
        <Pressable style={styles.continueCard} onPress={() => router.push('/experience')}>
          <View style={styles.continueIcon}><Feather name="clock" size={19} color={ui.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.continueTitle}>{visitedSites.length ? 'Return to the station' : 'Your first time machine awaits'}</Text>
            <Text style={styles.continueCopy}>{visitedSites.length ? 'Continue the 1920 experience' : 'Experience East London Railway Station'}</Text>
          </View>
          <Feather name="play" size={16} color={ui.primary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Popular heritage trails" action="See all" onAction={() => router.push('/trails')} />
        <Pressable style={styles.trailCard} onPress={() => router.push('/trail')}>
          <Image source={trail.image} style={styles.trailImage} />
          <View style={styles.trailInfo}>
            <Text style={styles.trailName}>{trail.name}</Text>
            <Text style={styles.trailMeta}>{trail.duration}  ·  {trail.stops} locations</Text>
          </View>
          <View style={styles.trailArrow}><Feather name="arrow-up-right" size={16} color={ui.foreground} /></View>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 20 },
  welcomeTitle: { color: ui.foreground, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },
  welcomeCopy: { color: ui.mutedForeground, fontSize: 15, marginTop: 5 },
  heroCard: { marginBottom: 27 },
  heroContent: { padding: 22, paddingTop: 155 },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 15, backgroundColor: 'rgba(8,8,18,0.6)', marginBottom: 19 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F0BB77' },
  liveText: { color: '#F5D8AF', fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  heroTitle: { color: ui.foreground, fontSize: 43, lineHeight: 42, fontWeight: '700', letterSpacing: -1.5 },
  heroSubtitle: { color: '#D6D1DF', fontSize: 16, marginTop: 8, marginBottom: 18 },
  section: { marginBottom: 28 },
  nearbyRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: ui.card, borderRadius: 22, gap: 12 },
  nearbyImage: { width: 70, height: 70, borderRadius: 17 },
  nearbyText: { flex: 1, gap: 4 },
  nearbyName: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  nearbyDescription: { color: ui.mutedForeground, fontSize: 12 },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  locationText: { color: ui.accent, fontSize: 11, fontWeight: '600' },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, backgroundColor: '#141329', borderRadius: 21, borderWidth: 1, borderColor: '#2B2748' },
  continueIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#242040', alignItems: 'center', justifyContent: 'center' },
  continueTitle: { color: ui.foreground, fontSize: 13, fontWeight: '700' },
  continueCopy: { color: ui.mutedForeground, fontSize: 12, marginTop: 4 },
  trailCard: { height: 170, borderRadius: 23, overflow: 'hidden', justifyContent: 'flex-end' },
  trailImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  trailInfo: { padding: 17, backgroundColor: 'rgba(8,8,18,0.62)' },
  trailName: { color: ui.foreground, fontSize: 16, fontWeight: '700' },
  trailMeta: { color: '#C0B8CE', fontSize: 12, marginTop: 5 },
  trailArrow: { position: 'absolute', right: 15, top: 15, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(8,8,18,0.5)', alignItems: 'center', justifyContent: 'center' },
});
