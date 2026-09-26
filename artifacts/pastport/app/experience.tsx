import { Feather } from '@expo/vector-icons';
// Demo mode uses a looping location video instead of the live camera.
// import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View, Image } from 'react-native';
// import { Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { station, periods } from '@/data/pastport';
import eastLondonHistoryVideo from '@/assets/audio/East London History Video.mp4';
import stationThenNow1920 from '@/assets/images/1920vs2026.png';
import stationThenNow1950 from '@/assets/images/1950vs2026.png';
import stationPresent from '@/assets/images/station-2026.png';
import storyStationNow from '@/assets/images/story-station-now.jpg';
import storyStationExperience from '@/assets/images/story-station-experience.jpg';
import storyStationOld from '@/assets/images/story-station-old.jpg';
import { usePastport } from '@/context/PastportContext';
import { IconButton, Pill, ui } from '@/components/PastportUI';
import { AskIlifa } from '@/components/AskIlifa';
import { NarrationPlayer } from '@/components/NarrationPlayer';
import { StationAmbience } from '@/components/StationAmbience';
import { DEFAULT_ILIFA_CONTEXT, periodForYear } from '@/lib/ilifa';
import { HistoricalModel, ModelTransform } from '@/components/HistoricalModel';
import { ModelControls, ModelOrbitSurface } from '@/components/ModelControls';
import { ArRecognition } from '@/components/ArRecognition';
import { PeopleExperiencesEntry } from '@/components/PeopleExperiencesEntry';
import { StoryAd, StoryAds } from '@/components/StoryAds';
import { StoryVideoSheet } from '@/components/StoryVideoSheet';
import { ShowMeThenCamera } from '@/components/ShowMeThenCamera';
import { experiencesForPlace } from '@/lib/peoplesExperiences';

const INITIAL_MODEL_TRANSFORM: ModelTransform = {
  scale: 1.05,
  position: [0, 0.1, 0],
  rotation: [0.06, 0, 0],
};

const SCAN_MS = 2200;
const DETECTED_MS = 1600;
const PRESENT_PREVIEW_MS = 2000;

const STORY_ADS: StoryAd[] = [
  {
    id: 'east-london-history',
    title: 'East London history',
    line: 'A local voice on this place.',
    detail: 'A local telling of East London’s story, from the station and the harbour to the people who still carry this city’s memory.',
    image: storyStationOld,
    speaker: 'Local voice',
    speakerRole: 'East London · history of this place',
    videoUrl: eastLondonHistoryVideo,
  },
  {
    id: 'arrival-hall',
    title: 'The arrival hall',
    line: 'The city’s first hello.',
    detail: 'Nomsa remembers selling fruit at the doors of this hall, and how the first sight of the station told people they had arrived in East London.',
    image: storyStationExperience,
    speaker: 'Nomsa Dlamini',
    speakerRole: 'East London · lived beside the station',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    id: 'railway-clock',
    title: 'The railway clock',
    line: 'Time on the concourse.',
    detail: 'Sipho talks about setting the day by the station clock — when trains left, when wages were paid, and when families waited.',
    image: storyStationNow,
    speaker: 'Sipho Nkosi',
    speakerRole: 'East London · former railway clerk',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'platform',
    title: 'Life on the platform',
    line: 'Journeys from this edge.',
    detail: 'Lindiwe describes the platform as the city’s edge: farewells at dawn, homecomings at dusk, and the stories that travelled with every train.',
    image: storyStationNow,
    speaker: 'Lindiwe Jacobs',
    speakerRole: 'East London · grew up on the platform',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
];

type ExperiencePhase = 'idle' | 'scanning' | 'detected' | 'ready';

export default function ExperienceScreen() {
  const { height } = useWindowDimensions();
  // const [permission, requestPermission] = useCameraPermissions();
  const { selectedYear, setSelectedYear, markVisited } = usePastport();
  const [year, setYear] = useState(selectedYear || 1920);
  const [phase, setPhase] = useState<ExperiencePhase>('idle');
  const [selectedStory, setSelectedStory] = useState<StoryAd | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [askIlifaOpen, setAskIlifaOpen] = useState(false);
  // const [cameraError, setCameraError] = useState<string | null>(null);
  // const [cameraGranted, setCameraGranted] = useState(false);
  const [modelTransform, setModelTransform] = useState<ModelTransform>(INITIAL_MODEL_TRANSFORM);
  const [modelOpacity, setModelOpacity] = useState(0.92);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showPresentModel, setShowPresentModel] = useState(false);
  const stageHeight = Math.min(300, Math.max(188, Math.round(height * 0.32)));

  // useEffect(() => {
  //   setCameraGranted(Boolean(permission?.granted));
  // }, [permission?.granted]);

  useEffect(() => {
    if (phase !== 'scanning' && phase !== 'detected') return undefined;
    const delay = phase === 'scanning' ? SCAN_MS : DETECTED_MS;
    const timeout = setTimeout(() => {
      setPhase(phase === 'scanning' ? 'detected' : 'ready');
      if (phase === 'detected') setNarrating(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'ready' || year !== 2026) {
      setShowPresentModel(false);
      return undefined;
    }
    setShowPresentModel(false);
    setModelError(null);
    setModelTransform(INITIAL_MODEL_TRANSFORM);
    setModelOpacity(0.92);
    const timeout = setTimeout(() => setShowPresentModel(true), PRESENT_PREVIEW_MS);
    return () => clearTimeout(timeout);
  }, [phase, year]);

  function beginScan() {
    setYear(1950);
    setSelectedYear(1950);
    setSelectedStory(null);
    setNarrating(false);
    setAskIlifaOpen(false);
    setShowPresentModel(false);
    setPhase('scanning');
    markVisited(station.id);
  }

  // async function requestCameraAccess() {
  //   setCameraError(null);
  //   if (permission?.canAskAgain === false) {
  //     await Linking.openSettings();
  //     return;
  //   }
  //   try {
  //     const nextPermission = await requestPermission();
  //     if (nextPermission?.granted) {
  //       setCameraGranted(true);
  //     } else if (nextPermission) {
  //       setCameraGranted(false);
  //       setCameraError('Camera access was not granted. You can enable it to continue.');
  //     }
  //   } catch {
  //     setCameraError('We could not start camera access. Check your device settings and try again.');
  //   }
  // }

  // function handleCameraMountError({ message }: { message: string }) {
  //   setCameraError(message || 'The camera could not be started on this device.');
  // }

  // const cameraUnavailable = !cameraGranted || Boolean(cameraError);
  const thenNowSource = year === 1920 ? stationThenNow1920 : year === 1950 ? stationThenNow1950 : null;
  const thenNowVisible = phase === 'ready' && thenNowSource != null;
  const presentPreviewVisible = phase === 'ready' && year === 2026 && !showPresentModel;
  const modelVisible = phase === 'ready' && year === 2026 && showPresentModel;

  function selectYear(nextYear: number) {
    setYear(nextYear);
    setSelectedYear(nextYear);
    setSelectedStory(null);
    setNarrating(false);
    setAskIlifaOpen(false);
    if (nextYear === 2026) {
      if (phase !== 'idle') setPhase('ready');
      return;
    }
    setShowPresentModel(false);
    if (nextYear === 1950) {
      if (phase !== 'ready') beginScan();
      return;
    }
    setPhase('ready');
  }

  function openAskIlifa() {
    setSelectedStory(null);
    setNarrating(false);
    setAskIlifaOpen(true);
  }

  function continueStory() {
    setAskIlifaOpen(false);
    setNarrating(true);
  }

  function turnModel(direction: -1 | 1) {
    setModelTransform((current) => ({
      ...current,
      rotation: [current.rotation[0], current.rotation[1] + direction * (Math.PI / 2), current.rotation[2]],
    }));
  }

  return (
    <View style={styles.screen}>
      <StationAmbience playing={phase === 'ready'} volume={selectedStory || askIlifaOpen ? 0.12 : 0.34} />
      <ShowMeThenCamera
        granted
        canAskAgain
        error={null}
        onMountError={() => undefined}
        onRequestAccess={() => undefined}
      />
      {/* Live camera path kept for later:
      <ShowMeThenCamera granted={!cameraUnavailable} canAskAgain={permission?.canAskAgain} error={cameraError} onMountError={handleCameraMountError} onRequestAccess={requestCameraAccess} />
      */}
      <View pointerEvents="none" style={styles.cameraTint}><LinearGradient colors={['rgba(7,7,17,0.28)', 'transparent', 'rgba(7,7,17,0.55)']} style={StyleSheet.absoluteFill} /></View>
      {phase === 'scanning' ? (
        <View pointerEvents="none" style={styles.scanOverlay} testID="full-scan-overlay">
          <ArRecognition phase="scanning" fullScreen />
        </View>
      ) : null}
      <View style={styles.hud} pointerEvents="box-none">
        <View style={styles.top}>
          <IconButton name="x" onPress={() => router.back()} />
          <View style={styles.mode}><View style={styles.modeDot} /><Text style={styles.modeText}>{phase === 'scanning' ? 'SCANNING' : phase === 'detected' ? 'MATCH FOUND' : `PASTPORT · ${year}`}</Text></View>
          <IconButton name="help-circle" onPress={() => router.push('/chat')} />
        </View>

        {phase === 'scanning' ? <View style={styles.storySpacer} /> : (
        <View style={[styles.stage, { height: stageHeight }]} testID="model-stage">
          {phase === 'idle' ? <IdleViewfinder /> : null}
          {phase === 'detected' ? <ArRecognition phase={phase} /> : null}
          {thenNowVisible && thenNowSource ? (
            <Image
              source={thenNowSource}
              style={styles.thenNowImage}
              resizeMode="cover"
              accessibilityLabel={
                year === 1920
                  ? 'East London Railway Station in 1920 beside 2026'
                  : 'East London Railway Station in 1950 beside 2026'
              }
              testID="then-now-image"
            />
          ) : null}
          {presentPreviewVisible ? (
            <Image
              source={stationPresent}
              style={styles.thenNowImage}
              resizeMode="cover"
              accessibilityLabel="East London Railway Station in 2026"
              testID="present-preview-image"
            />
          ) : null}
          {modelVisible ? (
            <ModelOrbitSurface style={styles.modelViewport} transform={modelTransform} onTransformChange={setModelTransform}>
              <HistoricalModel visible opacity={modelOpacity} transform={modelTransform} onLoadingChange={setModelLoading} onError={setModelError} />
              {modelLoading ? <View style={styles.modelStatus}><Text style={styles.modelStatusText}>Reconstructing the past…</Text></View> : null}
              {modelError ? (
                <View style={styles.modelError}>
                  <Text style={styles.modelErrorTitle}>Unable to load the historical reconstruction.</Text>
                  <Pressable onPress={() => setModelError(null)}>
                    <Text style={styles.modelErrorAction}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
            </ModelOrbitSurface>
          ) : null}
          {modelVisible ? (
            <ModelControls
              opacity={modelOpacity}
              onOpacityChange={setModelOpacity}
              onReset={() => { setModelTransform(INITIAL_MODEL_TRANSFORM); setModelOpacity(0.92); }}
              onTurn={turnModel}
            />
          ) : null}
        </View>
        )}

        {phase === 'ready' ? (
          <>
            <StoryAds stories={STORY_ADS} selectedId={selectedStory?.id ?? null} onSelect={(story) => { setNarrating(false); setSelectedStory(story); }} />
            <PeopleExperiencesEntry
              nearby={experiencesForPlace({ siteId: station.id, origin: station.coordinates }).length}
              onPress={() => {
                setSelectedStory(null);
                setNarrating(false);
                setAskIlifaOpen(false);
                router.push('/people-experiences');
              }}
            />
          </>
        ) : <View style={styles.storySpacer} />}

        <View style={styles.footer}>
          {phase === 'ready' ? <View style={[styles.narration, (!narrating || askIlifaOpen) && styles.narrationHidden]} testID="experience-narration"><NarrationPlayer compact autoPlay={narrating && !askIlifaOpen} /></View> : null}
          {phase === 'ready' && askIlifaOpen ? (
            <AskIlifa
              context={{ ...DEFAULT_ILIFA_CONTEXT, period: periodForYear(year) }}
              onContinueStory={continueStory}
              onClose={() => setAskIlifaOpen(false)}
            />
          ) : null}
          {phase === 'idle' ? (
            <Pressable testID="show-me-then" onPress={beginScan} style={({ pressed }) => [styles.showButton, pressed && styles.pressed]}>
              <View><Text style={styles.showEyebrow}>THE TIME MACHINE</Text><Text style={styles.showTitle}>SHOW ME THEN</Text></View>
              <View style={styles.showArrow}><Feather name="arrow-up-right" size={20} color="#0B0A13" /></View>
            </Pressable>
          ) : phase === 'ready' && !askIlifaOpen ? (
            <View style={styles.revealedActions}>
              <Pressable style={styles.askButton} onPress={openAskIlifa} testID="ask-ilifa-open"><Feather name="mic" size={17} color={ui.primary} /><Text style={styles.askText}>Ask Ilifa</Text></Pressable>
              <Pressable style={styles.listenButton} onPress={() => setNarrating((current) => !current)}><Feather name={narrating ? 'pause' : 'play'} size={16} color={ui.foreground} /></Pressable>
            </View>
          ) : phase === 'ready' ? null : phase === 'scanning' ? null : (
            <View style={styles.scanStatus}><Text style={styles.scanStatusText}>Station recognised</Text></View>
          )}
          {phase === 'scanning' ? null : (
            <>
              <View style={styles.timeHeader}><Text style={styles.timeLabel}>TIME TRAVEL</Text><Text style={styles.timeValue}>{year}</Text></View>
              <View style={styles.yearChips}>{periods.map((period) => <Pill key={period.year} label={String(period.year)} active={year === period.year} onPress={() => selectYear(period.year)} />)}</View>
              <View style={styles.disclaimer}>
                <Feather name="info" size={12} color={ui.mutedForeground} />
                <Text style={styles.disclaimerText}>
                  {phase === 'ready'
                    ? year === 2026
                      ? showPresentModel
                        ? 'Today’s station in 3D. Drag to orbit · pinch to zoom.'
                        : 'Today’s station. A 3D reconstruction appears in a moment.'
                      : `Then and now: the station in ${year} beside today.`
                    : 'Demo camera feed. Point at the building, then ask to see it then.'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      {selectedStory ? <StoryVideoSheet key={selectedStory.id} story={selectedStory} onClose={() => setSelectedStory(null)} /> : null}
    </View>
  );
}

function IdleViewfinder() {
  return (
    <View style={styles.viewfinder}>
      <View style={[styles.bracket, styles.bracketTopLeft]} />
      <View style={[styles.bracket, styles.bracketTopRight]} />
      <View style={[styles.bracket, styles.bracketBottomLeft]} />
      <View style={[styles.bracket, styles.bracketBottomRight]} />
      <Text style={styles.cameraEyebrow}>DEMO LOCATION</Text>
      <Text style={styles.cameraTitle}>East London Railway Station</Text>
      <Text style={styles.cameraCopy}>East London Railway Station · demo mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070711' },
  cameraTint: { ...StyleSheet.absoluteFill, zIndex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFill, zIndex: 3 },
  hud: { ...StyleSheet.absoluteFill, zIndex: 4, paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mode: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(10,9,21,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ui.accent },
  modeText: { color: ui.foreground, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  stage: { marginTop: 12, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(203,179,255,0.55)', backgroundColor: 'rgba(8,7,18,0.28)' },
  modelViewport: { flex: 1 },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  bracket: { position: 'absolute', width: 26, height: 26, borderColor: 'rgba(203,179,255,0.9)' },
  bracketTopLeft: { top: 14, left: 14, borderTopWidth: 2, borderLeftWidth: 2 },
  bracketTopRight: { top: 14, right: 14, borderTopWidth: 2, borderRightWidth: 2 },
  bracketBottomLeft: { bottom: 14, left: 14, borderBottomWidth: 2, borderLeftWidth: 2 },
  bracketBottomRight: { bottom: 14, right: 14, borderBottomWidth: 2, borderRightWidth: 2 },
  cameraEyebrow: { color: '#EDC48C', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  cameraTitle: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 7, textAlign: 'center' },
  cameraCopy: { color: '#D1CCD9', fontSize: 12, marginTop: 4, textAlign: 'center' },
  thenNowImage: { width: '100%', height: '100%' },
  modelStatus: { position: 'absolute', alignSelf: 'center', top: '42%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(16,13,31,0.88)', borderWidth: 1, borderColor: '#68549A' },
  modelStatusText: { color: ui.primary, fontSize: 11, fontWeight: '700' },
  modelError: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(28,20,41,0.92)' },
  modelErrorTitle: { color: ui.foreground, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  modelErrorAction: { color: ui.primary, fontSize: 12, fontWeight: '700', marginTop: 10 },
  storySpacer: { flex: 1 },
  footer: { marginTop: 'auto' },
  showButton: { minHeight: 72, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 22, backgroundColor: ui.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  showEyebrow: { color: '#554875', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  showTitle: { color: '#0B0A13', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
  showArrow: { width: 43, height: 43, borderRadius: 16, backgroundColor: '#D9C8FF', alignItems: 'center', justifyContent: 'center' },
  revealedActions: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  askButton: { flex: 1, minHeight: 46, borderRadius: 17, backgroundColor: '#262141', borderWidth: 1, borderColor: '#7564B7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  askText: { color: ui.foreground, fontWeight: '700', fontSize: 12 },
  listenButton: { width: 46, minHeight: 46, borderRadius: 17, backgroundColor: '#262141', borderWidth: 1, borderColor: ui.border, alignItems: 'center', justifyContent: 'center' },
  scanStatus: { minHeight: 46, borderRadius: 17, backgroundColor: 'rgba(22,18,40,0.9)', borderWidth: 1, borderColor: '#68549A', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  scanStatusText: { color: ui.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  timeLabel: { color: '#A39EB4', fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  timeValue: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  yearChips: { flexDirection: 'row' },
  disclaimer: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 10 },
  disclaimerText: { color: '#A19CAA', fontSize: 9, flex: 1 },
  narration: { marginBottom: 36, borderRadius: 18, padding: 12, backgroundColor: 'rgba(21,18,42,0.93)', borderWidth: 1, borderColor: '#554A85' },
  narrationHidden: { height: 0, overflow: 'hidden', marginBottom: 0, padding: 0, borderWidth: 0 },
  pressed: { opacity: 0.78 },
});
