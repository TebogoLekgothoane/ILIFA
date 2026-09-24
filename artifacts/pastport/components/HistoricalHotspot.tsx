import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

export type Hotspot = { id: string; title: string; detail: string; x: number; y: number };

export function HistoricalHotspot({ hotspot, onPress }: { hotspot: Hotspot; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.hotspot, { left: `${hotspot.x}%`, top: `${hotspot.y}%` }]}><View style={styles.pin}><Feather name="plus" size={14} color="#100D1B" /></View><Text style={styles.label}>{hotspot.title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', zIndex: 5, alignItems: 'center', transform: [{ translateX: -35 }] },
  pin: { width: 30, height: 30, borderRadius: 15, backgroundColor: ui.primary, borderWidth: 3, borderColor: 'rgba(15,12,29,0.8)', alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, color: ui.foreground, backgroundColor: 'rgba(12,10,27,0.82)', overflow: 'hidden', fontSize: 9, fontWeight: '700' },
});
