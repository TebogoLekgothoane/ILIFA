import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

export function SourceCard({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  return <View style={styles.card}><View style={styles.header}><View><Text style={styles.eyebrow}>HISTORICAL DETAIL</Text><Text style={styles.title}>{title}</Text></View><Pressable onPress={onClose}><Feather name="x" size={19} color={ui.mutedForeground} /></Pressable></View><Text style={styles.copy}>{detail}</Text><View style={styles.source}><Text style={styles.sourceLabel}>SOURCE</Text><Text style={styles.sourceCopy}>Reconstruction detail based on historical photographs and archival references.</Text></View></View>;
}

const styles = StyleSheet.create({
  card: { position: 'absolute', zIndex: 9, left: 18, right: 18, bottom: 205, borderRadius: 20, padding: 16, backgroundColor: 'rgba(20,17,39,0.97)', borderWidth: 1, borderColor: '#5B4A86' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: ui.accent, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  title: { color: ui.foreground, fontSize: 19, fontWeight: '700', marginTop: 5 },
  copy: { color: '#D2CDDC', fontSize: 12, lineHeight: 18, marginTop: 12 },
  source: { borderTopWidth: 1, borderTopColor: '#42385D', marginTop: 13, paddingTop: 11 },
  sourceLabel: { color: '#A9A2B8', fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  sourceCopy: { color: ui.primary, fontSize: 10, lineHeight: 15, marginTop: 5 },
});
