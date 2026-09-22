import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { station, periods, SiteObject } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';
import { IconButton, Pill, ui } from '@/components/PastportUI';

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

export default function ExperienceScreen() {
  const { selectedYear, setSelectedYear, markVisited } = usePastport();
  const [year, setYear] = useState(selectedYear || 1920);
  const [revealed, setRevealed] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SiteObject | null>(null);
  const [narrating, setNarrating] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const stationOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: revealed ? 1 : 0, duration: 900, useNativeDriver: true }),
      Animated.timing(stationOpacity, { toValue: revealed ? 0.22 : 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, revealed, stationOpacity]);

  function showThen() {
    setRevealed(true);
    setYear(1920);
    setSelectedYear(1920);
    setNarrating(true);
    markVisited(station.id);
  }

  return (
    <View style={styles.screen}>
      <AnimatedImageBackground source={station.hero} style={[styles.camera, { opacity: stationOpacity }]}>
        <LinearGradient colors={['rgba(7,7,17,0.7)', 'transparent', 'rgba(7,7,17,0.9)']} style={StyleSheet.absoluteFill} />
      </AnimatedImageBackground>
      <AnimatedImageBackground source={station.reconstruction} style={[styles.camera, styles.reconstruction, { opacity: overlayOpacity }]}>
        <LinearGradient colors={['rgba(18,10,32,0.35)', 'transparent', 'rgba(7,7,17,0.95)']} style={StyleSheet.absoluteFill} />
      </AnimatedImageBackground>
      <View style={styles.top}><IconButton name="x" onPress={() => router.back()} /><View style={styles.mode}><View style={styles.modeDot} /><Text style={styles.modeText}>PASTPORT · {year}</Text></View><IconButton name="help-circle" onPress={() => router.push('/chat')} /></View>
      <View style={styles.scanLine} />
      <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
      <View style={styles.cameraLabel}><Text style={styles.cameraEyebrow}>{revealed ? 'AI RECONSTRUCTION' : 'CURRENT LOCATION'}</Text><Text style={styles.cameraTitle}>{revealed ? 'East London · 1920' : 'East London Railway Station'}</Text><Text style={styles.cameraCopy}>{revealed ? 'Based on available historical sources' : 'Point your camera at a place with a story'}</Text></View>
      {revealed ? station.objects.map((object) => <ObjectHotspot key={object.id} object={object} onPress={() => setSelectedObject(object)} />) : null}
      {selectedObject ? <ObjectCard object={selectedObject} onClose={() => setSelectedObject(null)} onAsk={() => router.push('/chat')} /> : null}
      {narrating && !selectedObject ? <View style={styles.narration}><View style={styles.narrationIcon}><Feather name="volume-2" size={16} color={ui.accent} /></View><View style={{ flex: 1 }}><Text style={styles.narrationTitle}>Story in progress</Text><Text style={styles.narrationCopy}>“In 1920, this location looked very different…”</Text></View><Pressable onPress={() => setNarrating(false)}><Feather name="pause" size={17} color={ui.foreground} /></Pressable></View> : null}
      <View style={styles.bottom}>
        {!revealed ? <Pressable testID="show-me-then" onPress={showThen} style={({ pressed }) => [styles.showButton, pressed && styles.pressed]}><View><Text style={styles.showEyebrow}>THE TIME MACHINE</Text><Text style={styles.showTitle}>SHOW ME THEN</Text></View><View style={styles.showArrow}><Feather name="arrow-up-right" size={20} color="#0B0A13" /></View></Pressable> : <View style={styles.revealedActions}><Pressable style={styles.askButton} onPress={() => router.push('/chat')}><Feather name="message-circle" size={17} color={ui.primary} /><Text style={styles.askText}>Ask about this place</Text></Pressable><Pressable style={styles.listenButton} onPress={() => setNarrating((current) => !current)}><Feather name={narrating ? 'pause' : 'play'} size={16} color={ui.foreground} /></Pressable></View>}
        <View style={styles.timeHeader}><Text style={styles.timeLabel}>TIME TRAVEL</Text><Text style={styles.timeValue}>{year}</Text></View>
        <View style={styles.yearChips}>{periods.map((period) => <Pill key={period.year} label={String(period.year)} active={year === period.year} onPress={() => { setYear(period.year); setSelectedYear(period.year); setRevealed(period.year !== 2026); }} />)}</View>
        <View style={styles.disclaimer}><Feather name="info" size={12} color={ui.mutedForeground} /><Text style={styles.disclaimerText}>{revealed ? 'AI-generated reconstruction based on available historical sources.' : 'The present-day view stays anchored to the place you are standing.'}</Text></View>
      </View>
    </View>
  );
}

function ObjectHotspot({ object, onPress }: { object: SiteObject; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.hotspot, { left: `${object.x}%`, top: `${object.y}%` }]}><View style={styles.hotspotRing}><View style={styles.hotspotDot} /></View><Text style={styles.hotspotLabel}>{object.title}</Text></Pressable>;
}

function ObjectCard({ object, onClose, onAsk }: { object: SiteObject; onClose: () => void; onAsk: () => void }) {
  return <View style={styles.objectCard}><View style={styles.objectHeader}><View><Text style={styles.objectEyebrow}>WHAT YOU'RE SEEING</Text><Text style={styles.objectTitle}>{object.title}</Text></View><Pressable onPress={onClose}><Feather name="x" size={18} color={ui.mutedForeground} /></Pressable></View><Text style={styles.objectDescription}>{object.description}</Text><View style={styles.objectMeta}><Text style={styles.objectMetaLabel}>DATE</Text><Text style={styles.objectMetaValue}>{object.date}</Text><Text style={styles.objectMetaLabel}>SOURCE</Text><Text style={styles.objectMetaValue}>{object.source}</Text></View><Text style={styles.objectSignificance}>{object.significance}</Text><Pressable style={styles.objectAsk} onPress={onAsk}><Text style={styles.objectAskText}>Ask about this</Text><Feather name="arrow-up-right" size={15} color={ui.primary} /></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070711' },
  camera: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  reconstruction: { zIndex: 1 },
  top: { position: 'absolute', top: 57, left: 17, right: 17, zIndex: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mode: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(10,9,21,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ui.accent },
  modeText: { color: ui.foreground, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  scanLine: { position: 'absolute', top: '41%', left: 30, right: 30, height: 1, backgroundColor: 'rgba(185,156,255,0.45)', zIndex: 2 },
  corner: { position: 'absolute', width: 25, height: 25, borderColor: 'rgba(203,179,255,0.85)', zIndex: 3 },
  topLeft: { top: '31%', left: 27, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: '31%', right: 27, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { top: '56%', left: 27, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { top: '56%', right: 27, borderBottomWidth: 2, borderRightWidth: 2 },
  cameraLabel: { position: 'absolute', top: '17%', left: 28, right: 28, zIndex: 3 },
  cameraEyebrow: { color: '#EDC48C', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  cameraTitle: { color: ui.foreground, fontSize: 23, fontWeight: '700', marginTop: 7 },
  cameraCopy: { color: '#D1CCD9', fontSize: 12, marginTop: 4 },
  hotspot: { position: 'absolute', zIndex: 4, alignItems: 'center', transform: [{ translateX: -24 }] },
  hotspotRing: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: ui.accent, backgroundColor: 'rgba(185,156,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hotspotDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ui.foreground },
  hotspotLabel: { color: ui.foreground, backgroundColor: 'rgba(9,8,18,0.7)', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, fontSize: 9, marginTop: 4, overflow: 'hidden' },
  bottom: { position: 'absolute', left: 18, right: 18, bottom: 27, zIndex: 5 },
  showButton: { minHeight: 75, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 22, backgroundColor: ui.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  showEyebrow: { color: '#554875', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  showTitle: { color: '#0B0A13', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
  showArrow: { width: 43, height: 43, borderRadius: 16, backgroundColor: '#D9C8FF', alignItems: 'center', justifyContent: 'center' },
  revealedActions: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  askButton: { flex: 1, minHeight: 49, borderRadius: 17, backgroundColor: '#262141', borderWidth: 1, borderColor: '#7564B7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  askText: { color: ui.foreground, fontWeight: '700', fontSize: 12 },
  listenButton: { width: 49, minHeight: 49, borderRadius: 17, backgroundColor: '#262141', borderWidth: 1, borderColor: ui.border, alignItems: 'center', justifyContent: 'center' },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  timeLabel: { color: '#A39EB4', fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  timeValue: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  yearChips: { flexDirection: 'row' },
  disclaimer: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 10 },
  disclaimerText: { color: '#A19CAA', fontSize: 9, flex: 1 },
  narration: { position: 'absolute', left: 18, right: 18, bottom: 244, zIndex: 5, borderRadius: 18, padding: 12, backgroundColor: 'rgba(21,18,42,0.93)', borderWidth: 1, borderColor: '#554A85', flexDirection: 'row', alignItems: 'center', gap: 10 },
  narrationIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#2E2754', alignItems: 'center', justifyContent: 'center' },
  narrationTitle: { color: ui.accent, fontSize: 10, fontWeight: '700' },
  narrationCopy: { color: ui.foreground, fontSize: 11, marginTop: 4 },
  objectCard: { position: 'absolute', left: 18, right: 18, bottom: 225, zIndex: 8, backgroundColor: 'rgba(20,18,38,0.97)', borderRadius: 22, borderWidth: 1, borderColor: '#554A85', padding: 17 },
  objectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  objectEyebrow: { color: ui.accent, fontSize: 9, letterSpacing: 1.3, fontWeight: '700' },
  objectTitle: { color: ui.foreground, fontSize: 20, fontWeight: '700', marginTop: 5 },
  objectDescription: { color: '#C8C2D3', fontSize: 12, lineHeight: 18, marginTop: 12 },
  objectMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13 },
  objectMetaLabel: { color: '#89849C', fontSize: 8, letterSpacing: 1.1, fontWeight: '700' },
  objectMetaValue: { color: ui.foreground, fontSize: 10, marginRight: 8 },
  objectSignificance: { color: ui.accent, fontSize: 11, lineHeight: 16, marginTop: 12, fontStyle: 'italic' },
  objectAsk: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, marginTop: 12, borderTopWidth: 1, borderTopColor: ui.border },
  objectAskText: { color: ui.primary, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});