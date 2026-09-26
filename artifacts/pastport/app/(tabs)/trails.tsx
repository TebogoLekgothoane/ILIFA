import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeroImage, PrimaryButton, ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { moreTrails, trail } from '@/data/pastport';
import { openTrailPlaces } from '@/lib/directions';

export default function TrailsScreen() {
  return (
    <ScreenShell>
      <TopBar title="Trails" eyebrow="WALK THROUGH HISTORY" right={<Feather name="compass" size={21} color={ui.accent} />} />
      <HeroImage image={trail.image} height={315} style={styles.trailHero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>FEATURED TRAIL</Text>
          <Text style={styles.heroTitle}>{trail.name}</Text>
          <Text style={styles.heroCopy}>{trail.description}</Text>
          <PrimaryButton label="View trail" onPress={() => router.push('/trail')} />
        </View>
      </HeroImage>
      <View style={styles.section}>
        <SectionHeading title="Your progress" />
        <Pressable style={styles.progressCard} onPress={() => router.push('/trail')}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>East London Heritage Trail</Text>
            <Text style={styles.progressValue}>3 / 8</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressCopy}>Three places discovered. Keep walking.</Text>
        </Pressable>
      </View>
      <SectionHeading title="More ways to explore" />
      {moreTrails.map((item) => (
        <TrailMini
          key={item.id}
          title={item.title}
          meta={item.meta}
          icon={item.icon}
          onPress={() => {
            void openTrailPlaces(item.mapPlaces);
          }}
        />
      ))}
    </ScreenShell>
  );
}

function TrailMini({
  title,
  meta,
  icon,
  onPress,
}: {
  title: string;
  meta: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable testID={`trail-mini-${title}`} style={styles.miniRow} onPress={onPress}>
      <View style={styles.miniIcon}>
        <Feather name={icon} size={18} color={ui.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.miniTitle}>{title}</Text>
        <Text style={styles.miniMeta}>{meta}</Text>
      </View>
      <Feather name="arrow-up-right" size={17} color={ui.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trailHero: { marginBottom: 27 },
  heroContent: { padding: 20, paddingTop: 120 },
  heroEyebrow: { color: '#F0C991', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  heroTitle: { color: ui.foreground, fontSize: 25, fontWeight: '700', maxWidth: 270 },
  heroCopy: { color: '#D8D3DE', fontSize: 12, lineHeight: 17, marginVertical: 8, maxWidth: 290 },
  section: { marginBottom: 28 },
  progressCard: { backgroundColor: ui.card, borderRadius: 22, padding: 17 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: ui.foreground, fontSize: 13, fontWeight: '700' },
  progressValue: { color: ui.accent, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 7, backgroundColor: '#2A2743', borderRadius: 5, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', width: '38%', backgroundColor: ui.primary, borderRadius: 5 },
  progressCopy: { color: ui.mutedForeground, fontSize: 11, marginTop: 10 },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: ui.border,
  },
  miniIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#201D3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  miniMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 4 },
});
