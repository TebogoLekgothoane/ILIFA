import { Feather } from '@expo/vector-icons';
import {
  createAudioPlayer,
  type AudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioStream,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ui } from '@/components/PastportUI';
import {
  fetchIlifaLiveToken,
  IlifaClientError,
  type IlifaGuideContext,
  type IlifaLanguage,
} from '@/lib/ilifa';
import {
  createIlifaLiveSession,
  type IlifaLiveSession,
  type LiveSessionPhase,
} from '@/lib/ilifaLiveSession';
import {
  float32ToInt16Pcm,
  int16BufferToBase64,
  pcmBase64DurationMs,
  pcmChunksToWavBase64,
  resampleInt16Pcm,
} from '@/lib/pcm';

type VoiceState = LiveSessionPhase | 'permission' | 'processing';

type AskIlifaProps = {
  context: IlifaGuideContext;
  onClose: () => void;
};

const TARGET_INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
const MIN_PLAY_CHUNK_MS = 480;
const SPEECH_RMS = 350;
const BARGE_IN_RMS = 1800;
const SILENCE_END_MS = 700;
const LISTEN_ARM_MS = 450;

export function AskIlifa({ context, onClose }: AskIlifaProps) {
  const sessionRef = useRef<IlifaLiveSession | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const playQueueRef = useRef<Array<{ wav: string; durationMs: number }>>([]);
  const pcmChunksRef = useRef<string[]>([]);
  const pcmRateRef = useRef(OUTPUT_RATE);
  const pcmPendingMsRef = useRef(0);
  const playingRef = useRef(false);
  const playbackIdRef = useRef(0);
  const speakingRef = useRef(false);
  const speechActiveRef = useRef(false);
  const endedTurnRef = useRef(false);
  const closedByUserRef = useRef(false);
  const readyAtRef = useRef(0);
  const listenReadyAtRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const languageRef = useRef<IlifaLanguage>('auto');
  const generationRef = useRef(0);

  const [phase, setPhase] = useState<VoiceState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [typedQuestion, setTypedQuestion] = useState('');
  const [showTyped, setShowTyped] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [modelTranscript, setModelTranscript] = useState('');
  const [language, setLanguage] = useState<IlifaLanguage>('auto');
  const [canAskAgain, setCanAskAgain] = useState(true);

  languageRef.current = language;

  const { stream } = useAudioStream({
    sampleRate: TARGET_INPUT_RATE,
    channels: 1,
    encoding: 'int16',
    onBuffer: (buffer) => {
      const session = sessionRef.current;
      if (!session?.isOpen()) return;

      let samples: Int16Array;
      try {
        samples = new Int16Array(buffer.data);
      } catch {
        samples = float32ToInt16Pcm(buffer.data);
      }

      const rate = buffer.sampleRate || TARGET_INPUT_RATE;
      if (rate !== TARGET_INPUT_RATE) {
        samples = resampleInt16Pcm(samples, rate, TARGET_INPUT_RATE);
      }

      const rms = rootMeanSquare(samples);
      if (playingRef.current) {
        if (rms >= BARGE_IN_RMS) interruptForUser();
        return;
      }
      if (Date.now() < listenReadyAtRef.current) return;

      watchUserSpeech(rms, session);
      session.sendPcmBase64(int16BufferToBase64(samples), TARGET_INPUT_RATE);
    },
  });

  const languageBootstrapped = useRef(false);

  useEffect(() => {
    void startLiveSession();
    return () => {
      void teardown();
    };
  }, []);

  useEffect(() => {
    if (!languageBootstrapped.current) {
      languageBootstrapped.current = true;
      return;
    }
    void startLiveSession();
  }, [language]);

  async function teardown() {
    closedByUserRef.current = true;
    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    clearSilenceTimer();
    try {
      stream?.stop?.();
    } catch {
      // Stream may already be stopped.
    }
    sessionRef.current?.stop();
    sessionRef.current = null;
    playQueueRef.current = [];
    pcmChunksRef.current = [];
    pcmPendingMsRef.current = 0;
    speakingRef.current = false;
    speechActiveRef.current = false;
    await stopReplyAudio();
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function watchUserSpeech(rms: number, session: IlifaLiveSession) {
    if (rms >= SPEECH_RMS) {
      speechActiveRef.current = true;
      endedTurnRef.current = false;
      clearSilenceTimer();
      return;
    }
    if (!speechActiveRef.current || endedTurnRef.current) return;
    if (silenceTimerRef.current) return;
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (!speechActiveRef.current || playingRef.current || endedTurnRef.current) return;
      endedTurnRef.current = true;
      speechActiveRef.current = false;
      setPhase('processing');
      session.sendAudioStreamEnd();
    }, SILENCE_END_MS);
  }

  function interruptForUser() {
    playbackIdRef.current += 1;
    playQueueRef.current = [];
    pcmChunksRef.current = [];
    pcmPendingMsRef.current = 0;
    speakingRef.current = false;
    endedTurnRef.current = false;
    speechActiveRef.current = true;
    clearSilenceTimer();
    void stopReplyAudio();
    listenReadyAtRef.current = Date.now() + 200;
    setPhase('listening');
    void restartMic();
  }

  function returnToListening() {
    speakingRef.current = false;
    playingRef.current = false;
    endedTurnRef.current = false;
    speechActiveRef.current = false;
    listenReadyAtRef.current = Date.now() + LISTEN_ARM_MS;
    clearSilenceTimer();
    setPhase('listening');
    void restartMic();
  }

  async function stopReplyAudio() {
    playingRef.current = false;
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // Playback cleanup should never block the guide.
    }
  }

  async function startLiveSession() {
    const generation = ++generationRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    closedByUserRef.current = false;
    setError(null);
    setShowTyped(false);
    setPhase('connecting');
    playQueueRef.current = [];
    pcmChunksRef.current = [];
    pcmPendingMsRef.current = 0;
    speakingRef.current = false;
    speechActiveRef.current = false;
    endedTurnRef.current = false;
    clearSilenceTimer();
    await stopReplyAudio();
    sessionRef.current?.stop();
    sessionRef.current = null;

    try {
      stream?.stop?.();
    } catch {
      // Ignore.
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (generation !== generationRef.current) return;
      setCanAskAgain(permission.canAskAgain !== false);
      if (!permission.granted) {
        setPhase('permission');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        interruptionMode: 'mixWithOthers',
      });

      const token = await fetchIlifaLiveToken(
        { ...context, language: languageRef.current },
        { signal: controller.signal },
      );
      if (generation !== generationRef.current) return;

      const session = createIlifaLiveSession(token, {
        onPhase: (next) => {
          if (generation !== generationRef.current) return;
          if (next === 'speaking') {
            speakingRef.current = true;
            speechActiveRef.current = false;
            endedTurnRef.current = false;
            clearSilenceTimer();
            setPhase('speaking');
            return;
          }
          if (next === 'listening' && !playingRef.current) {
            returnToListening();
          }
        },
        onTranscript: (transcript) => {
          if (generation !== generationRef.current) return;
          if (transcript.role === 'user') setUserTranscript(transcript.text);
          else setModelTranscript(transcript.text);
        },
        onAudio: (pcmBase64, sampleRate) => {
          if (generation !== generationRef.current) return;
          speakingRef.current = true;
          setPhase('speaking');
          enqueueModelPcm(pcmBase64, sampleRate);
        },
        onTurnComplete: () => {
          if (generation !== generationRef.current) return;
          flushModelPcm();
          if (!playingRef.current && playQueueRef.current.length === 0) {
            returnToListening();
          }
        },
        onInterrupted: () => {
          if (generation !== generationRef.current) return;
          interruptForUser();
        },
        onError: (message) => {
          if (generation !== generationRef.current) return;
          setError(message);
          setPhase('error');
        },
        onDisconnected: () => {
          if (generation !== generationRef.current || closedByUserRef.current) return;
          if (Date.now() - readyAtRef.current < 2000) {
            setError('The live guide disconnected. Please try again.');
            setPhase('error');
            return;
          }
          void startLiveSession();
        },
        onReady: () => {
          if (generation !== generationRef.current) return;
          readyAtRef.current = Date.now();
          returnToListening();
        },
      });

      sessionRef.current = session;
    } catch (caught) {
      if (generation !== generationRef.current) return;
      if (controller.signal.aborted) return;
      const message =
        caught instanceof IlifaClientError
          ? caught.message
          : 'Ilifa could not start a live session. Please try again.';
      setError(message);
      setPhase('error');
    }
  }

  function enqueueModelPcm(pcmBase64: string, sampleRate: number) {
    pcmRateRef.current = sampleRate || OUTPUT_RATE;
    pcmChunksRef.current.push(pcmBase64);
    pcmPendingMsRef.current += pcmBase64DurationMs(pcmBase64, pcmRateRef.current);
    if (pcmPendingMsRef.current >= MIN_PLAY_CHUNK_MS) flushModelPcm();
  }

  function flushModelPcm() {
    if (pcmChunksRef.current.length === 0) return;
    const rate = pcmRateRef.current;
    const durationMs = pcmPendingMsRef.current;
    const wav = pcmChunksToWavBase64(pcmChunksRef.current, rate);
    pcmChunksRef.current = [];
    pcmPendingMsRef.current = 0;
    if (!wav) return;
    playQueueRef.current.push({ wav, durationMs });
    void drainPlaybackQueue();
  }

  async function restartMic() {
    if (!stream || typeof stream.start !== 'function') return;
    try {
      stream.stop();
    } catch {
      // Already stopped after playback interrupted capture.
    }
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        interruptionMode: 'mixWithOthers',
      });
      await stream.start();
    } catch {
      setError('The microphone could not be started. Check your device settings and try again.');
      setPhase('error');
    }
  }

  async function drainPlaybackQueue() {
    if (playingRef.current) return;
    const playbackId = ++playbackIdRef.current;
    playingRef.current = true;
    speakingRef.current = true;
    setPhase('speaking');

    while (playQueueRef.current.length > 0) {
      if (playbackId !== playbackIdRef.current) return;
      const chunk = playQueueRef.current.shift();
      if (!chunk) break;
      try {
        await playWavChunk(chunk.wav, chunk.durationMs);
      } catch {
        // Skip a bad chunk and continue the queue.
      }
    }

    if (playbackId !== playbackIdRef.current) return;
    playingRef.current = false;
    returnToListening();
  }

  async function playWavChunk(wavBase64: string, durationMs: number) {
    const directory = FileSystem.cacheDirectory;
    if (!directory) return;

    const path = `${directory}ilifa-live-${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(path, wavBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      try {
        const previous = playerRef.current;
        playerRef.current = null;
        if (previous) {
          try {
            previous.pause();
            previous.remove();
          } catch {
            // Ignore.
          }
        }

        const player = createAudioPlayer({ uri: path });
        playerRef.current = player;
        let subscription: { remove: () => void } | null = null;
        const onStatus = (status: { didJustFinish?: boolean }) => {
          if (status.didJustFinish) {
            try {
              subscription?.remove();
            } catch {
              // Ignore.
            }
            finish();
          }
        };
        try {
          subscription = player.addListener('playbackStatusUpdate', onStatus);
        } catch {
          setTimeout(finish, 800);
        }
        player.play();
        setTimeout(finish, Math.min(12_000, Math.max(600, durationMs + 350)));
      } catch {
        finish();
      }
    });
  }

  function sendTyped() {
    const question = typedQuestion.trim();
    if (!question) {
      setError('Type a question about this place, then send it.');
      setPhase('error');
      return;
    }
    const session = sessionRef.current;
    if (!session?.isOpen()) {
      setError('Ilifa is not connected yet. Please wait a moment.');
      setPhase('error');
      return;
    }
    setUserTranscript(question);
    setPhase('processing');
    session.sendText(question);
    session.sendAudioStreamEnd();
    setTypedQuestion('');
    setShowTyped(false);
  }

  async function openMicrophoneSettings() {
    await Linking.openSettings();
  }

  async function handleClose() {
    await teardown();
    onClose();
  }

  const status = statusCopy(phase, language);

  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => void handleClose()}>
      <View style={styles.overlay} testID="ask-ilifa">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>ASK ILIFA</Text>
            <Pressable onPress={() => void handleClose()} hitSlop={12} testID="ask-ilifa-close">
              <Feather name="x" size={18} color={ui.mutedForeground} />
            </Pressable>
          </View>

          {phase === 'connecting' ? (
            <View style={styles.center} testID="ask-ilifa-connecting">
              <ActivityIndicator color={ui.primary} />
              <Text style={styles.title}>Connecting...</Text>
              <Text style={styles.subtitle}>Opening a live voice session with Ilifa...</Text>
            </View>
          ) : null}

          {phase === 'listening' || phase === 'processing' || phase === 'speaking' ? (
            <>
              <View style={styles.langRow}>
                <LanguageChip label="Auto" active={language === 'auto'} onPress={() => setLanguage('auto')} />
                <LanguageChip label="English" active={language === 'en'} onPress={() => setLanguage('en')} />
                <LanguageChip label="isiXhosa" active={language === 'xh'} onPress={() => setLanguage('xh')} />
              </View>
              <View style={styles.voiceBlock}>
                <VoiceStateMic state={phase} />
                <Text style={styles.title} testID="ask-ilifa-state">
                  {status.title}
                </Text>
                <Text style={styles.subtitle}>{status.subtitle}</Text>
              </View>
              {userTranscript ? (
                <Text style={styles.quote} testID="ask-ilifa-user-transcript">
                  “{userTranscript}”
                </Text>
              ) : (
                <Text style={styles.quote}>
                  {language === 'xh' ? '“Kutheni le sitiishoni ibalulekile?”' : '“Why was this station important?”'}
                </Text>
              )}
              {modelTranscript ? (
                <Text style={styles.answer} testID="ask-ilifa-answer">
                  {modelTranscript}
                </Text>
              ) : null}
              {showTyped ? (
                <View style={styles.typedRow}>
                  <TextInput
                    value={typedQuestion}
                    onChangeText={setTypedQuestion}
                    placeholder="Type a question about this place"
                    placeholderTextColor={ui.mutedForeground}
                    style={styles.input}
                    returnKeyType="send"
                    onSubmitEditing={sendTyped}
                  />
                  <Pressable onPress={sendTyped} style={styles.send} testID="ask-ilifa-send-text">
                    <Feather name="arrow-up" size={16} color="#0B0A13" />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setShowTyped(true)} testID="ask-ilifa-type">
                  <Text style={styles.typeInstead}>Type instead</Text>
                </Pressable>
              )}
            </>
          ) : null}

          {phase === 'permission' ? (
            <View testID="ask-ilifa-permission">
              <Text style={styles.title}>Microphone access is needed</Text>
              <Text style={styles.subtitle}>
                {canAskAgain
                  ? 'Ilifa listens on this device so you can ask about the station by voice. Enable the microphone to continue.'
                  : 'Microphone access is turned off. Open settings, enable the microphone for this app, then return here.'}
              </Text>
              <Pressable
                onPress={() => void (canAskAgain ? startLiveSession() : openMicrophoneSettings())}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>{canAskAgain ? 'Enable microphone' : 'Open microphone settings'}</Text>
              </Pressable>
            </View>
          ) : null}

          {phase === 'error' ? (
            <View testID="ask-ilifa-error">
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>{error}</Text>
              <Pressable onPress={() => void startLiveSession()} style={styles.primary} testID="ask-ilifa-retry">
                <Text style={styles.primaryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function AskIlifaMicButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      testID="ask-ilifa-open"
      accessibilityLabel="Ask Ilifa"
      style={styles.launchButton}
    >
      <PulseRing color={ui.primary} />
      <View style={styles.launchCore}>
        <Feather name="mic" size={18} color="#0B0A13" />
      </View>
    </Pressable>
  );
}

function VoiceStateMic({ state }: { state: 'listening' | 'processing' | 'speaking' }) {
  const color = state === 'speaking' ? ui.accent : state === 'processing' ? '#C7B8F2' : ui.primary;
  const icon = state === 'speaking' ? 'volume-2' : 'mic';
  return (
    <View style={styles.voiceMic} testID={`ask-ilifa-mic-${state}`}>
      {state === 'processing' ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          <PulseRing color={color} />
          <View style={[styles.voiceCore, { backgroundColor: color }]}>
            <Feather name={icon} size={22} color="#0B0A13" />
          </View>
        </>
      )}
    </View>
  );
}

function PulseRing({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return <Animated.View pointerEvents="none" style={[styles.pulse, { borderColor: color, opacity, transform: [{ scale }] }]} />;
}

function statusCopy(phase: VoiceState, language: IlifaLanguage) {
  if (phase === 'processing') {
    return {
      title: language === 'xh' ? 'Ucinga...' : 'Thinking...',
      subtitle: language === 'xh' ? 'Ilifa uva umbuzo wakho.' : 'Ilifa heard you and is answering.',
    };
  }
  if (phase === 'speaking') {
    return {
      title: language === 'xh' ? 'Uyathetha' : 'Speaking',
      subtitle: language === 'xh' ? 'Thetha ukuphazamisa.' : 'Speak to interrupt, or wait and ask again.',
    };
  }
  return {
    title: language === 'xh' ? 'Uyamamela...' : 'Listening...',
    subtitle: language === 'xh' ? 'Thetha ngokukhululekileyo.' : 'Speak naturally. Ilifa will answer, then listen again.',
  };
}

function rootMeanSquare(samples: Int16Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i] ?? 0;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length);
}

function LanguageChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.langChip, active && styles.langChipActive]}>
      <Text style={[styles.langChipText, active && styles.langChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,7,17,0.62)', padding: 16, paddingBottom: 28 },
  sheet: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(21,18,42,0.97)', borderWidth: 1, borderColor: '#554A85' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eyebrow: { color: ui.accent, fontSize: 8, letterSpacing: 1.4, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  langChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#201C3D', borderWidth: 1, borderColor: '#3E3762' },
  langChipActive: { backgroundColor: 'rgba(185,156,255,0.22)', borderColor: ui.primary },
  langChipText: { color: ui.mutedForeground, fontSize: 10, fontWeight: '700' },
  langChipTextActive: { color: ui.foreground },
  voiceBlock: { alignItems: 'center', marginBottom: 14 },
  voiceMic: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  voiceCore: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 2 },
  launchButton: { width: 46, minHeight: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  launchCore: { width: 46, height: 46, borderRadius: 23, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  title: { color: ui.foreground, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#D1CCD9', fontSize: 12, marginTop: 4, lineHeight: 17, textAlign: 'center' },
  quote: { color: ui.mutedForeground, fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  typeInstead: { color: ui.mutedForeground, fontSize: 11, marginBottom: 4, textAlign: 'center' },
  typedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  input: { flex: 1, minHeight: 40, borderRadius: 12, paddingHorizontal: 12, color: ui.foreground, backgroundColor: '#201C3D', fontSize: 13 },
  send: { width: 36, height: 36, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  answer: { color: '#D4D0DB', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  primary: { minHeight: 44, borderRadius: 16, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { color: '#0B0A13', fontWeight: '700', fontSize: 13 },
});
