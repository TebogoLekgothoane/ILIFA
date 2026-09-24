import { Feather } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import narrationAudio from '@/assets/audio/east-london-narration.mp3';
import { ui } from '@/components/PastportUI';

const WAVE_LEVELS = [0.42, 0.78, 1, 0.55, 0.9, 0.48, 0.72, 0.86];

export function NarrationPlayer({ compact = false, autoPlay = false }: { compact?: boolean; autoPlay?: boolean }) {
  const player = useAudioPlayer(narrationAudio, { updateInterval: 250, downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const shouldPlay = useRef(autoPlay);
  shouldPlay.current = autoPlay;

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      const asset = Asset.fromModule(narrationAudio);
      await asset.downloadAsync();
      if (cancelled) return;
      if (asset.localUri) player.replace({ uri: asset.localUri });
      player.volume = 1;
      if (shouldPlay.current) player.play();
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    if (!status.isLoaded) return;
    if (autoPlay) player.play();
    else player.pause();
  }, [autoPlay, player, status.isLoaded]);

  function togglePlayback() {
    if (status.playing) {
      player.pause();
      return;
    }
    player.volume = 1;
    player.play();
  }

  const duration = Math.max(status.duration || 0, 1);

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.top}>
        <Pressable testID="narration-audio-icon" onPress={togglePlayback} style={styles.icon}>
          <Feather name="volume-2" size={compact ? 14 : 17} color={ui.accent} />
          <AudioWaves playing={status.playing} />
        </Pressable>
        <View style={styles.copy}>
          <Text style={styles.label}>PASTPORT NARRATION</Text>
          <Text style={styles.title}>The station in 1920</Text>
        </View>
        <Pressable onPress={togglePlayback} style={styles.play}>
          <Feather name={status.playing ? 'pause' : 'play'} size={compact ? 14 : 17} color="#0B0A13" />
        </Pressable>
        <Pressable onPress={() => { player.seekTo(0); player.play(); }} style={styles.replay}>
          <Feather name="rotate-ccw" size={14} color={ui.foreground} />
        </Pressable>
      </View>
      {!compact ? (
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(status.currentTime)}</Text>
          <Text style={styles.time}>Demo reconstruction narration</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AudioWaves({ playing }: { playing: boolean }) {
  const motion = useRef(WAVE_LEVELS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!playing) {
      motion.forEach((value) => value.setValue(0));
      return undefined;
    }

    const animations = motion.map((value, index) => Animated.sequence([
      Animated.delay(index * 36),
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 260 + (index % 3) * 70, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 260 + (index % 3) * 70, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ]));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [motion, playing]);

  return (
    <View style={styles.wave}>
      {motion.map((value, index) => {
        const scale = value.interpolate({ inputRange: [0, 1], outputRange: [WAVE_LEVELS[index] * 0.38, WAVE_LEVELS[index]] });
        return <Animated.View key={index} style={[styles.waveBar, { transform: [{ scaleY: scale }] }]} />;
      })}
    </View>
  );
}

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#181631', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#3E3762' },
  compactCard: { padding: 0, backgroundColor: 'transparent', borderWidth: 0, flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { height: 35, paddingLeft: 9, paddingRight: 10, borderRadius: 12, backgroundColor: '#2B2450', flexDirection: 'row', alignItems: 'center', gap: 7 },
  copy: { flex: 1 },
  label: { color: ui.accent, fontSize: 8, letterSpacing: 1.1, fontWeight: '700' },
  title: { color: ui.foreground, fontSize: 12, fontWeight: '700', marginTop: 4 },
  play: { width: 34, height: 34, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#292541', alignItems: 'center', justifyContent: 'center' },
  wave: { width: 34, height: 16, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 2.5, height: 16, borderRadius: 1.5, backgroundColor: ui.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  time: { color: ui.mutedForeground, fontSize: 9 },
});
