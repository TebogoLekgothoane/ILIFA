import { Feather } from '@expo/vector-icons';
import {
  createAudioPlayer,
  type AudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ui } from '@/components/PastportUI';
import {
  generateIlifaResponse,
  IlifaClientError,
  type IlifaAskRequest,
  type IlifaAskResponse,
  type IlifaGuideContext,
  type IlifaHistoryTurn,
  type IlifaLanguage,
} from '@/lib/ilifa';

type AskPhase = 'listening' | 'thinking' | 'speaking' | 'error' | 'permission';

type AskIlifaProps = {
  context: IlifaGuideContext;
  onContinueStory: () => void;
  onClose?: () => void;
};

export function AskIlifa({ context, onContinueStory, onClose }: AskIlifaProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<AskPhase>('listening');
  const [error, setError] = useState<string | null>(null);
  const [typedQuestion, setTypedQuestion] = useState('');
  const [showTyped, setShowTyped] = useState(false);
  const [reply, setReply] = useState<IlifaAskResponse | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState<IlifaLanguage>('auto');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const historyRef = useRef<IlifaHistoryTurn[]>([]);
  const lastRequestRef = useRef<IlifaAskRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void beginListening();
    return () => {
      abortRef.current?.abort();
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      void stopReplyAudio();
      void recorder.stop().catch(() => undefined);
    };
  }, []);

  async function stopReplyAudio() {
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // Playback cleanup should never block the guide.
    }
    setSpeaking(false);
  }

  async function beginListening() {
    setError(null);
    setReply(null);
    setShowTyped(false);
    await stopReplyAudio();

    try {
      const permission = await requestRecordingPermissionsAsync();
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
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('listening');
    } catch {
      setError('The microphone could not be started. Check your device settings and try again.');
      setPhase('error');
    }
  }

  async function stopListeningAndAsk() {
    try {
      await recorder.stop();
    } catch {
      setError('The recording could not be saved. Please try again.');
      setPhase('error');
      return;
    }

    const uri = recorder.uri;
    const duration = recorderState.durationMillis ?? 0;
    if (!uri || duration < 400) {
      setError('That recording was too short. Ask again when you are ready.');
      setPhase('error');
      return;
    }

    try {
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      if (!audioBase64) {
        setError('That recording was empty. Please ask again.');
        setPhase('error');
        return;
      }
      await askIlifa({
        ...context,
        language,
        audioBase64,
        audioMimeType: 'audio/m4a',
        history: historyRef.current,
      });
    } catch {
      setError('Ilifa could not read the recording. Please try again.');
      setPhase('error');
    }
  }

  async function askTyped() {
    const question = typedQuestion.trim();
    if (!question) {
      setError('Type a question about this place, then send it.');
      setPhase('error');
      return;
    }
    await recorder.stop().catch(() => undefined);
    await askIlifa({
      ...context,
      language,
      question,
      history: historyRef.current,
    });
  }

  async function askIlifa(request: IlifaAskRequest) {
    lastRequestRef.current = request;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('thinking');
    setError(null);
    setReply(null);

    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    thinkingTimerRef.current = setTimeout(() => {
      controller.abort();
    }, 70_000);

    try {
      const response = await generateIlifaResponse(request, { signal: controller.signal, timeoutMs: 70_000 });
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      historyRef.current = [...historyRef.current, { question: response.question || request.question || '', answer: response.answer }].slice(-4);
      setReply(response);
      setPhase('speaking');
      await playReply(response);
    } catch (caught) {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      const message = caught instanceof IlifaClientError
        ? caught.message
        : 'Ilifa could not answer just now. Please try again.';
      setError(message);
      setPhase('error');
    }
  }

  async function playReply(response: IlifaAskResponse) {
    await stopReplyAudio();
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
    });

    const uri = await resolveReplyUri(response);
    if (!uri) {
      setSpeaking(false);
      return;
    }

    try {
      const player = createAudioPlayer({ uri });
      playerRef.current = player;
      player.play();
      setSpeaking(true);
    } catch {
      setSpeaking(false);
      setError('The answer is ready, but the spoken reply could not be played.');
    }
  }

  async function toggleReplyPlayback() {
    const player = playerRef.current;
    if (!player) {
      if (reply) await playReply(reply);
      return;
    }
    if (speaking) {
      player.pause();
      setSpeaking(false);
      return;
    }
    player.play();
    setSpeaking(true);
  }

  async function retry() {
    if (lastRequestRef.current) {
      await askIlifa(lastRequestRef.current);
      return;
    }
    await beginListening();
  }

  async function openMicrophoneSettings() {
    await Linking.openSettings();
  }

  return (
    <View style={styles.card} testID="ask-ilifa">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{phase === 'listening' ? 'ASK ILIFA' : 'ILIFA'}</Text>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={10} testID="ask-ilifa-close">
            <Feather name="x" size={16} color={ui.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {phase === 'listening' ? (
        <>
          <View style={styles.langRow}>
            <LanguageChip label="Auto" active={language === 'auto'} onPress={() => setLanguage('auto')} />
            <LanguageChip label="English" active={language === 'en'} onPress={() => setLanguage('en')} />
            <LanguageChip label="isiXhosa" active={language === 'xh'} onPress={() => setLanguage('xh')} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.mic}><Feather name="mic" size={18} color="#0B0A13" /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>{language === 'xh' ? 'Uyamamela...' : 'Listening...'}</Text>
              <Text style={styles.subtitle}>{language === 'xh' ? 'Thetha ngokukhululekileyo.' : 'Speak naturally.'}</Text>
            </View>
          </View>
          <Text style={styles.quote}>{language === 'xh' ? '“Kutheni le sitiishoni ibalulekile?”' : '“Why was this station important?”'}</Text>
          {showTyped ? (
            <View style={styles.typedRow}>
              <TextInput
                value={typedQuestion}
                onChangeText={setTypedQuestion}
                placeholder="Type a question about this place"
                placeholderTextColor={ui.mutedForeground}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={() => void askTyped()}
              />
              <Pressable onPress={() => void askTyped()} style={styles.send} testID="ask-ilifa-send-text">
                <Feather name="arrow-up" size={16} color="#0B0A13" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setShowTyped(true)} testID="ask-ilifa-type">
              <Text style={styles.typeInstead}>Type instead</Text>
            </Pressable>
          )}
          <Pressable onPress={() => void stopListeningAndAsk()} style={styles.primary} testID="ask-ilifa-stop">
            <Text style={styles.primaryText}>Stop</Text>
          </Pressable>
        </>
      ) : null}

      {phase === 'thinking' ? (
        <View style={styles.center} testID="ask-ilifa-thinking">
          <ActivityIndicator color={ui.primary} />
          <Text style={styles.title}>Thinking...</Text>
          <Text style={styles.subtitle}>Understanding your question about East London Railway Station...</Text>
        </View>
      ) : null}

      {phase === 'speaking' && reply ? (
        <>
          <View style={styles.statusRow}>
            <View style={[styles.mic, styles.speak]}><Feather name="volume-2" size={18} color="#0B0A13" /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>{speaking ? 'Speaking' : 'Paused'}</Text>
              <Text style={styles.subtitle}>{reply.question || 'Your question'}</Text>
            </View>
          </View>
          <Text style={styles.answer} testID="ask-ilifa-answer">{reply.answer}</Text>
          {!reply.audioBase64 && !reply.audioUrl ? (
            <Text style={styles.noAudio}>Text answer ready. Spoken audio was unavailable this time.</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={() => void toggleReplyPlayback()} style={styles.secondary} testID="ask-ilifa-pause">
              <Feather name={speaking ? 'pause' : 'play'} size={14} color={ui.foreground} />
              <Text style={styles.secondaryText}>{speaking ? 'Pause' : 'Play'}</Text>
            </Pressable>
            <Pressable onPress={() => void beginListening()} style={styles.secondary} testID="ask-ilifa-another">
              <Text style={styles.secondaryText}>Ask another question</Text>
            </Pressable>
          </View>
          <Pressable onPress={onContinueStory} style={styles.primary} testID="ask-ilifa-continue">
            <Text style={styles.primaryText}>Continue story</Text>
          </Pressable>
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
          <Pressable onPress={() => void (canAskAgain ? beginListening() : openMicrophoneSettings())} style={styles.primary}>
            <Text style={styles.primaryText}>{canAskAgain ? 'Enable microphone' : 'Open microphone settings'}</Text>
          </Pressable>
          <Pressable onPress={onContinueStory} style={styles.link}>
            <Text style={styles.linkText}>Continue story</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'error' ? (
        <View testID="ask-ilifa-error">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => void retry()} style={styles.primary} testID="ask-ilifa-retry">
              <Text style={styles.primaryText}>Retry</Text>
            </Pressable>
            <Pressable onPress={() => void beginListening()} style={styles.secondary}>
              <Text style={styles.secondaryText}>Ask again</Text>
            </Pressable>
          </View>
          <Pressable onPress={onContinueStory} style={styles.link}>
            <Text style={styles.linkText}>Continue story</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

async function resolveReplyUri(response: IlifaAskResponse): Promise<string | null> {
  if (response.audioUrl) return response.audioUrl;
  if (!response.audioBase64) return null;

  const directory = FileSystem.cacheDirectory;
  if (!directory) return null;
  const extension = response.audioMimeType?.includes('mpeg') ? 'mp3' : 'wav';
  const path = `${directory}ilifa-reply.${extension}`;
  await FileSystem.writeAsStringAsync(path, response.audioBase64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
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
  card: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(21,18,42,0.93)', borderWidth: 1, borderColor: '#554A85', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eyebrow: { color: ui.accent, fontSize: 8, letterSpacing: 1.4, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  langChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#201C3D', borderWidth: 1, borderColor: '#3E3762' },
  langChipActive: { backgroundColor: 'rgba(185,156,255,0.22)', borderColor: ui.primary },
  langChipText: { color: ui.mutedForeground, fontSize: 10, fontWeight: '700' },
  langChipTextActive: { color: ui.foreground },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mic: { width: 36, height: 36, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  speak: { backgroundColor: ui.accent },
  copy: { flex: 1 },
  title: { color: ui.foreground, fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#D1CCD9', fontSize: 12, marginTop: 4, lineHeight: 17 },
  quote: { color: ui.mutedForeground, fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  typeInstead: { color: ui.mutedForeground, fontSize: 11, marginBottom: 12 },
  typedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  input: { flex: 1, minHeight: 40, borderRadius: 12, paddingHorizontal: 12, color: ui.foreground, backgroundColor: '#201C3D', fontSize: 13 },
  send: { width: 36, height: 36, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  answer: { color: '#D4D0DB', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  noAudio: { color: ui.mutedForeground, fontSize: 10, marginBottom: 10 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  primary: { minHeight: 44, borderRadius: 16, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#0B0A13', fontWeight: '700', fontSize: 13 },
  secondary: { flex: 1, minHeight: 40, borderRadius: 14, backgroundColor: '#262141', borderWidth: 1, borderColor: '#7564B7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  secondaryText: { color: ui.foreground, fontWeight: '700', fontSize: 11 },
  link: { alignItems: 'center', paddingVertical: 10 },
  linkText: { color: ui.accent, fontSize: 12, fontWeight: '700' },
});
