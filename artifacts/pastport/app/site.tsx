import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { station, periods } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';
import { IconButton, PrimaryButton, ui } from '@/components/PastportUI';
import { NarrationPlayer } from '@/components/NarrationPlayer';
import { StationAmbience } from '@/components/StationAmbience';

export default function SiteScreen() {
  const { savedSites, toggleSaved, setSelectedYear } = usePastport();
  const [year, setYear] = useState(1920);
  const [showPlayer, setShowPlayer] = useState(false);
  const saved = savedSites.includes(station.id);
  return (
    <View style={styles.screen}>
      <StationAmbience />
      <ImageBackground source={station.hero} style={styles.cover}>
        <LinearGradient colors={['rgba(8,8,18,0.36)', 'rgba(8,8,18,0.98)']} style={StyleSheet.absoluteFill} />
        <View style={styles.top}><IconButton name="arrow-left" onPress={() => router.back()} /><IconButton name={saved ? 'bookmark' : 'bookmark'} active={saved} onPress={() => toggleSaved(station.id)} /></View>
        <View style={styles.coverContent}><Text style={styles.eyebrow}>HISTORICAL SITE · EAST LONDON</Text><Text style={styles.title}>{station.name}</Text><View style={styles.location}><Feather name="map-pin" size={13} color={ui.accent} /><Text style={styles.locationText}>{station.area}</Text></View></View>
      </ImageBackground>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 45 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{station.description}</Text>
        <View style={styles.actionRow}><Pressable style={styles.action} onPress={() => router.push('/experience')}><View style={styles.actionIcon}><Feather name="maximize" size={18} color={ui.primary} /></View><Text style={styles.actionText}>Experience{'\n'}in AR</Text></Pressable><Pressable style={styles.action} onPress={() => setShowPlayer((current) => !current)}><View style={styles.actionIcon}><Feather name="volume-2" size={18} color={ui.accent} /></View><Text style={styles.actionText}>Listen to{'\n'}story</Text></Pressable><Pressable style={styles.action} onPress={() => undefined}><View style={styles.actionIcon}><Feather name="clock" size={18} color={ui.accent} /></View><Text style={styles.actionText}>Explore{'\n'}timeline</Text></Pressable><Pressable style={styles.action} onPress={() => router.push('/chat')}><View style={styles.actionIcon}><Feather name="message-circle" size={18} color={ui.accent} /></View><Text style={styles.actionText}>Ask{'\n'}PASTPORT</Text></Pressable></View>
        {showPlayer ? <View style={styles.player}><NarrationPlayer autoPlay /></View> : null}
        <View style={styles.timelineHeader}><Text style={styles.sectionTitle}>A place in time</Text><Text style={styles.timelineValue}>{year}</Text></View>
        <View style={styles.yearRow}>{periods.map((period) => <Pressable key={period.year} onPress={() => { setYear(period.year); setSelectedYear(period.year); }}><Text style={[styles.year, year === period.year && styles.yearActive]}>{period.year}</Text></Pressable>)}</View>
        <View style={styles.timelineTrack}><View style={[styles.timelineFill, { width: year === 2026 ? '100%' : year === 1950 ? '55%' : '18%' }]} /><View style={[styles.timelineKnob, { left: year === 2026 ? '96%' : year === 1950 ? '55%' : '18%' }]} /></View>
        <Text style={styles.timelineCopy}>{periods.find((period) => period.year === year)?.caption}</Text>
        <PrimaryButton label="Show me this place in 1920" icon="arrow-right" onPress={() => router.push('/experience')} />
        <View style={styles.sourceNote}><Feather name="info" size={14} color={ui.mutedForeground} /><Text style={styles.sourceText}>Historical details are documented where sources are available. Reconstructions are clearly labelled.</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  cover: { height: 395, justifyContent: 'space-between' },
  top: { paddingTop: 57, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between' },
  coverContent: { padding: 22, paddingBottom: 25 },
  eyebrow: { color: '#E7BB7D', fontSize: 9, letterSpacing: 1.3, fontWeight: '700', marginBottom: 12 },
  title: { color: ui.foreground, fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  locationText: { color: '#D2CDDB', fontSize: 13 },
  body: { marginTop: -1, paddingHorizontal: 20 },
  description: { color: '#C3BECD', fontSize: 15, lineHeight: 22, marginTop: 21, marginBottom: 21 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  action: { alignItems: 'center', gap: 8, width: '24%' },
  actionIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#201C3D', alignItems: 'center', justifyContent: 'center' },
  actionText: { color: ui.foreground, fontSize: 10, lineHeight: 14, textAlign: 'center', fontWeight: '600' },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: ui.foreground, fontSize: 19, fontWeight: '700' },
  timelineValue: { color: ui.accent, fontSize: 18, fontWeight: '700' },
  yearRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  year: { color: ui.mutedForeground, fontSize: 12, fontWeight: '600' },
  yearActive: { color: ui.foreground },
  timelineTrack: { height: 6, borderRadius: 4, backgroundColor: '#2A2742', marginTop: 12, position: 'relative' },
  timelineFill: { height: '100%', borderRadius: 4, backgroundColor: ui.primary },
  timelineKnob: { position: 'absolute', top: -5, marginLeft: -7, width: 16, height: 16, borderRadius: 8, backgroundColor: ui.foreground, borderWidth: 4, borderColor: ui.primary },
  timelineCopy: { color: ui.mutedForeground, fontSize: 12, marginTop: 13, marginBottom: 18 },
  sourceNote: { flexDirection: 'row', gap: 8, marginTop: 18, paddingHorizontal: 4 },
  sourceText: { color: ui.mutedForeground, fontSize: 10, lineHeight: 15, flex: 1 },
  player: { marginBottom: 22 },
});