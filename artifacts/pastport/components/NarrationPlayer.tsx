import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import narrationAudio from '@/assets/audio/narration-demo.wav';
import { ui } from '@/components/PastportUI';

export function NarrationPlayer({ compact = false, autoPlay = false }: { compact?: boolean; autoPlay?: boolean }) {
  const player = useAudioPlayer(narrationAudio, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (autoPlay) player.play();
  }, [autoPlay, player]);

  const duration = Math.max(status.duration || 9, 1);
  const progress = Math.min(status.currentTime / duration, 1);
  const seek = (event: { nativeEvent: { locationX: number } }) => {
    if (trackWidth > 0) player.seekTo((event.nativeEvent.locationX / trackWidth) * duration);
  };

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.top}>
        <View style={styles.icon}><Feather name="volume-2" size={compact ? 14 : 17} color={ui.accent} /></View>
        <View style={styles.copy}>
          <Text style={styles.label}>PASTPORT NARRATION</Text>
          <Text style={styles.title}>The station in 1920</Text>
        </View>
        <Pressable onPress={() => (status.playing ? player.pause() : player.play())} style={styles.play}>
          <Feather name={status.playing ? 'pause' : 'play'} size={compact ? 14 : 17} color="#0B0A13" />
        </Pressable>
        <Pressable onPress={() => { player.seekTo(0); player.play(); }} style={styles.replay}>
          <Feather name="rotate-ccw" size={14} color={ui.foreground} />
        </Pressable>
      </View>
      <Pressable
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onPress={seek}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        <View style={[styles.knob, { left: `${progress * 100}%` }]} />
      </Pressable>
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

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `0:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#181631', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#3E3762' },
  compactCard: { padding: 0, backgroundColor: 'transparent', borderWidth: 0, flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#2B2450', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  label: { color: ui.accent, fontSize: 8, letterSpacing: 1.1, fontWeight: '700' },
  title: { color: ui.foreground, fontSize: 12, fontWeight: '700', marginTop: 4 },
  play: { width: 34, height: 34, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#292541', alignItems: 'center', justifyContent: 'center' },
  track: { height: 12, backgroundColor: '#302B4D', borderRadius: 6, marginTop: 13, justifyContent: 'center' },
  fill: { height: 4, backgroundColor: ui.primary, borderRadius: 3 },
  knob: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: ui.foreground, marginLeft: -5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  time: { color: ui.mutedForeground, fontSize: 9 },
});