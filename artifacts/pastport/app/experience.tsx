import { Feather } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { station, periods, SiteObject } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';
import { IconButton, Pill, ui } from '@/components/PastportUI';
import { NarrationPlayer } from '@/components/NarrationPlayer';
import { HistoricalModel, ModelTransform } from '@/components/HistoricalModel';
import { HistoricalHotspot, Hotspot } from '@/components/HistoricalHotspot';
import { ModelControls } from '@/components/ModelControls';
import { SourceCard } from '@/components/SourceCard';
import { ShowMeThenCamera } from '@/components/ShowMeThenCamera';

const INITIAL_MODEL_TRANSFORM: ModelTransform = {
  scale: 0.08,
  position: [0, -0.65, 0],
  rotation: [0, 0, 0],
};

const MODEL_HOTSPOTS: Hotspot[] = [
  { id: 'arrival-hall', title: 'Arrival Hall', detail: 'Reconstruction detail — explore the main arrival area represented in this prototype model.', x: 50, y: 43 },
  { id: 'railway-clock', title: 'Railway Clock', detail: 'Reconstruction detail — the clock is included as a visible architectural feature in the model.', x: 52, y: 30 },
  { id: 'platform', title: 'Platform', detail: 'Reconstruction detail — the platform canopy and station edge are represented in this exterior model.', x: 74, y: 61 },
];

export default function ExperienceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { selectedYear, setSelectedYear, markVisited } = usePastport();
  const [year, setYear] = useState(selectedYear || 1920);
  const [revealed, setRevealed] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SiteObject | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [modelTransform, setModelTransform] = useState<ModelTransform>(INITIAL_MODEL_TRANSFORM);
  const [modelOpacity, setModelOpacity] = useState(0.72);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [aligning, setAligning] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const stationOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setCameraGranted(Boolean(permission?.granted));
  }, [permission?.granted]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: revealed ? 1 : 0, duration: 900, useNativeDriver: true }),
      Animated.timing(stationOpacity, { toValue: revealed ? 0.22 : 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, revealed, stationOpacity]);

  function showThen() {
    setRevealed(true);
    setYear(1950);
    setSelectedYear(1950);
    setModelError(null);
    setNarrating(true);
    markVisited(station.id);
  }

  async function requestCameraAccess() {
    setCameraError(null);

    if (permission?.canAskAgain === false) {
      await Linking.openSettings();
      return;
    }

    try {
      const nextPermission = await requestPermission();
      if (nextPermission?.granted) {
        setCameraGranted(true);
      } else if (nextPermission) {
        setCameraGranted(false);
        setCameraError('Camera access was not granted. You can enable it to continue.');
      }
    } catch {
      setCameraError('We could not start camera access. Check your device settings and try again.');
    }
  }

  function handleCameraMountError({ message }: { message: string }) {
    setCameraError(message || 'The camera could not be started on this device.');
  }

  const cameraUnavailable = !cameraGranted || Boolean(cameraError);
  const modelVisible = revealed && year === 1950 && !cameraUnavailable;

  function selectYear(nextYear: number) {
    setYear(nextYear);
    setSelectedYear(nextYear);
    setSelectedHotspot(null);
    setAligning(false);
    setRevealed(nextYear !== 2026);
    if (nextYear === 1950) setModelError(null);
  }

  return (
    <View style={styles.screen}>
      <ShowMeThenCamera granted={!cameraUnavailable} canAskAgain={permission?.canAskAgain} error={cameraError} onMountError={handleCameraMountError} onRequestAccess={requestCameraAccess} />
      <Animated.View pointerEvents="none" style={[styles.cameraTint, { opacity: stationOpacity }]}><LinearGradient colors={['rgba(7,7,17,0.4)', 'transparent', 'rgba(7,7,17,0.92)']} style={StyleSheet.absoluteFill} /></Animated.View>
      <HistoricalModel visible={modelVisible} opacity={modelOpacity} transform={modelTransform} onLoadingChange={setModelLoading} onError={setModelError} />
      <View style={styles.top}><IconButton name="x" onPress={() => router.back()} /><View style={styles.mode}><View style={styles.modeDot} /><Text style={styles.modeText}>PASTPORT · {year}</Text></View><IconButton name="help-circle" onPress={() => router.push('/chat')} /></View>
      <View style={styles.scanLine} />
      <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
      <View style={styles.cameraLabel}><Text style={styles.cameraEyebrow}>{revealed ? 'HISTORICAL RECONSTRUCTION' : 'DEMO LOCATION'}</Text><Text style={styles.cameraTitle}>{revealed ? `East London · ${year}` : 'East London Railway Station'}</Text><Text style={styles.cameraCopy}>{year === 1920 && revealed ? '1920 reconstruction coming soon.' : revealed ? 'Based on historical photographs and archival references.' : 'East London Railway Station · demo mode'}</Text></View>
      {modelVisible ? MODEL_HOTSPOTS.map((hotspot) => <HistoricalHotspot key={hotspot.id} hotspot={hotspot} onPress={() => setSelectedHotspot(hotspot)} />) : null}
      {modelVisible ? <ModelControls aligning={aligning} opacity={modelOpacity} transform={modelTransform} onAlign={() => setAligning((current) => !current)} onOpacityChange={setModelOpacity} onReset={() => { setModelTransform(INITIAL_MODEL_TRANSFORM); setModelOpacity(0.72); setAligning(false); }} onTransformChange={setModelTransform} /> : null}
      {modelLoading ? <View style={styles.modelStatus}><Text style={styles.modelStatusText}>Reconstructing the past…</Text></View> : null}
      {modelError ? <View style={styles.modelError}><Text style={styles.modelErrorTitle}>Unable to load the historical reconstruction.</Text><Pressable onPress={() => { setModelError(null); setRevealed(false); requestAnimationFrame(() => setRevealed(true)); }}><Text style={styles.modelErrorAction}>Try again</Text></Pressable></View> : null}
      {selectedObject ? <ObjectCard object={selectedObject} onClose={() => setSelectedObject(null)} onAsk={() => router.push('/chat')} /> : null}
      {selectedHotspot ? <SourceCard title={selectedHotspot.title} detail={selectedHotspot.detail} onClose={() => setSelectedHotspot(null)} /> : null}
      {narrating && !selectedObject ? <View style={styles.narration}><NarrationPlayer compact autoPlay={narrating} /></View> : null}
      <View style={styles.bottom}>
        {!revealed ? <Pressable testID="show-me-then" onPress={showThen} style={({ pressed }) => [styles.showButton, pressed && styles.pressed]}><View><Text style={styles.showEyebrow}>THE TIME MACHINE</Text><Text style={styles.showTitle}>SHOW ME THEN</Text></View><View style={styles.showArrow}><Feather name="arrow-up-right" size={20} color="#0B0A13" /></View></Pressable> : <View style={styles.revealedActions}><Pressable style={styles.askButton} onPress={() => router.push('/chat')}><Feather name="message-circle" size={17} color={ui.primary} /><Text style={styles.askText}>Ask about this place</Text></Pressable><Pressable style={styles.listenButton} onPress={() => setNarrating((current) => !current)}><Feather name={narrating ? 'pause' : 'play'} size={16} color={ui.foreground} /></Pressable></View>}
        <View style={styles.timeHeader}><Text style={styles.timeLabel}>TIME TRAVEL</Text><Text style={styles.timeValue}>{year}</Text></View>
        <View style={styles.yearChips}>{periods.map((period) => <Pill key={period.year} label={String(period.year)} active={year === period.year} onPress={() => selectYear(period.year)} />)}</View>
        <View style={styles.disclaimer}><Feather name="info" size={12} color={ui.mutedForeground} /><Text style={styles.disclaimerText}>{revealed ? 'Prototype reconstruction, not automatic AR tracking.' : 'The present-day view stays anchored to the place you are standing.'}</Text></View>
        {__DEV__ ? <Pressable onPress={() => router.push('/glb-test')}><Text style={styles.glbTestLink}>Test bundled GLB</Text></Pressable> : null}
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
  cameraTint: { ...StyleSheet.absoluteFill, zIndex: 1 },
  cameraFallback: { ...StyleSheet.absoluteFill, zIndex: 2, backgroundColor: '#0D0C1B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  permissionTitle: { color: ui.foreground, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 15 },
  permissionCopy: { color: ui.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  permissionButton: { backgroundColor: ui.primary, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  permissionButtonText: { color: '#0B0A13', fontSize: 12, fontWeight: '700' },
  historicalLayer: { ...StyleSheet.absoluteFill, zIndex: 2, justifyContent: 'center', alignItems: 'center' },
  reconstructedBuilding: { width: '75%', height: 190, backgroundColor: 'rgba(160,133,210,0.18)', borderWidth: 1, borderColor: 'rgba(224,205,255,0.78)', borderBottomWidth: 3, borderRadius: 6, shadowColor: ui.primary, shadowOpacity: 0.42, shadowRadius: 25 },
  roof: { position: 'absolute', top: -35, left: 20, right: 20, height: 55, backgroundColor: 'rgba(217,194,251,0.2)', borderWidth: 1, borderColor: 'rgba(224,205,255,0.68)', transform: [{ skewX: '-22deg' }] },
  buildingLabel: { color: '#F5EFFF', fontSize: 9, letterSpacing: 1.6, fontWeight: '700', marginTop: 12, backgroundColor: 'rgba(20,16,42,0.78)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  windowRow: { position: 'absolute', left: 20, right: 20, bottom: 25, flexDirection: 'row', justifyContent: 'space-between' },
  window: { width: 22, height: 43, borderWidth: 1, borderColor: 'rgba(252,229,174,0.8)', backgroundColor: 'rgba(248,203,111,0.24)', borderRadius: 3 },
  reconstructionPeople: { position: 'absolute', bottom: 110, left: '18%', flexDirection: 'row', gap: 28 },
  person: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F2D7AC', shadowColor: '#F2D7AC', shadowOpacity: 0.7, shadowRadius: 10 },
  carriage: { position: 'absolute', bottom: 92, right: '11%', width: 92, height: 25, borderRadius: 4, backgroundColor: 'rgba(92,77,122,0.8)', borderWidth: 1, borderColor: 'rgba(237,210,255,0.75)' },
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
  modelStatus: { position: 'absolute', zIndex: 8, top: '47%', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(16,13,31,0.88)', borderWidth: 1, borderColor: '#68549A' },
  modelStatusText: { color: ui.primary, fontSize: 11, fontWeight: '700' },
  modelError: { position: 'absolute', zIndex: 9, left: 28, right: 28, top: '43%', alignItems: 'center', padding: 16, borderRadius: 17, backgroundColor: 'rgba(28,20,41,0.96)', borderWidth: 1, borderColor: '#72528D' },
  modelErrorTitle: { color: ui.foreground, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  modelErrorAction: { color: ui.primary, fontSize: 12, fontWeight: '700', marginTop: 10 },
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
  glbTestLink: { color: '#BBA8F0', fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 9 },
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
