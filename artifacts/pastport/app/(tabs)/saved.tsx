import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { station } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';

export default function SavedScreen() {
  const { savedSites, visitedSites } = usePastport();
  return (
    <ScreenShell>
      <TopBar title="Saved" eyebrow="YOUR PERSONAL ARCHIVE" right={<Feather name="bookmark" size={21} color={ui.accent} />} />
      <View style={styles.journeyCard}><View style={styles.journeyHeader}><View><Text style={styles.journeyEyebrow}>MY JOURNEY</Text><Text style={styles.journeyTitle}>A map of your stories</Text></View><View style={styles.journeyCount}><Text style={styles.countText}>{visitedSites.length || 0}</Text><Text style={styles.countLabel}>visited</Text></View></View><View style={styles.journeyMap}><View style={styles.mapPath} /><View style={[styles.journeyPin, { left: '23%', top: '48%' }]} /><View style={[styles.journeyPin, { left: '54%', top: '28%' }]} /><View style={[styles.journeyPin, { left: '70%', top: '63%' }]} /><Text style={styles.mapWater}>EASTERN CAPE</Text></View></View>
      <SectionHeading title="Saved experiences" action="Edit" onAction={() => undefined} />
      {savedSites.length > 0 ? <Pressable style={styles.savedRow} onPress={() => router.push('/site')}><Image source={station.hero} style={styles.savedImage} /><View style={{ flex: 1 }}><Text style={styles.savedTitle}>{station.name}</Text><Text style={styles.savedMeta}>1920 · Historical site</Text></View><Feather name="chevron-right" size={17} color={ui.mutedForeground} /></Pressable> : <View style={styles.empty}><View style={styles.emptyIcon}><Feather name="bookmark" size={20} color={ui.primary} /></View><Text style={styles.emptyTitle}>Your archive is waiting</Text><Text style={styles.emptyCopy}>Save places, stories, and trails as you explore.</Text><Pressable onPress={() => router.push('/explore')}><Text style={styles.emptyAction}>Explore places</Text></Pressable></View>}
      <SectionHeading title="Your photographs" />
      <View style={styles.photoEmpty}><Feather name="image" size={19} color={ui.mutedForeground} /><Text style={styles.photoText}>Historical photographs you save will appear here.</Text></View>
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
  journeyMap: { height: 145, borderRadius: 17, backgroundColor: '#1D2141', marginTop: 15, overflow: 'hidden', position: 'relative' },
  mapPath: { position: 'absolute', width: '80%', height: 2, backgroundColor: '#7768B6', top: 82, left: 30, transform: [{ rotate: '-20deg' }] },
  journeyPin: { position: 'absolute', width: 13, height: 13, borderRadius: 7, backgroundColor: ui.accent, borderWidth: 3, borderColor: '#3E365D' },
  mapWater: { position: 'absolute', right: 12, bottom: 12, color: '#7A7A9D', fontSize: 9, letterSpacing: 1 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: ui.card, padding: 10, borderRadius: 20, marginBottom: 25 },
  savedImage: { width: 62, height: 62, borderRadius: 15 },
  savedTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  savedMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 5 },
  empty: { alignItems: 'center', backgroundColor: ui.card, padding: 27, borderRadius: 22, marginBottom: 27 },
  emptyIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#24203E', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: ui.foreground, fontSize: 15, fontWeight: '700' },
  emptyCopy: { color: ui.mutedForeground, fontSize: 12, marginTop: 6, textAlign: 'center' },
  emptyAction: { color: ui.accent, fontSize: 12, fontWeight: '700', marginTop: 15 },
  photoEmpty: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, backgroundColor: ui.card, borderRadius: 18 },
  photoText: { color: ui.mutedForeground, fontSize: 12, flex: 1 },
});