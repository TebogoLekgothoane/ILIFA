import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HistoricalModel, ModelTransform } from '@/components/HistoricalModel';
import { ui } from '@/components/PastportUI';

const INITIAL_TRANSFORM: ModelTransform = { scale: 0.08, position: [0, -0.65, 0], rotation: [0, 0, 0] };

export default function GLBTestScreen() {
  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return <View style={styles.screen}>
    <HistoricalModel visible opacity={1} transform={transform} onLoadingChange={setLoading} onError={setError} />
    <View style={styles.header}><Text style={styles.eyebrow}>ISOLATED DEVICE TEST</Text><Text style={styles.title}>East London Railway Station · 1950</Text><Text style={styles.copy}>{loading ? 'Loading bundled GLB…' : error ? 'GLB load failed' : 'Bundled GLB loaded successfully'}</Text></View>
    {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
    <View style={styles.actions}><Pressable onPress={() => setTransform((current) => ({ ...current, scale: Math.max(0.02, current.scale - 0.01) }))} style={styles.button}><Text style={styles.buttonText}>Smaller</Text></Pressable><Pressable onPress={() => setTransform((current) => ({ ...current, scale: Math.min(0.28, current.scale + 0.01) }))} style={styles.button}><Text style={styles.buttonText}>Larger</Text></Pressable><Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>Back</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070711' },
  header: { position: 'absolute', zIndex: 3, left: 22, right: 22, top: 66 },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 6 },
  copy: { color: '#C9C2D5', fontSize: 12, marginTop: 6 },
  error: { position: 'absolute', zIndex: 4, top: '45%', left: 24, right: 24, padding: 15, borderRadius: 16, backgroundColor: '#2B1E38', borderWidth: 1, borderColor: '#7F5A96' },
  errorText: { color: ui.foreground, textAlign: 'center', fontSize: 12 },
  actions: { position: 'absolute', zIndex: 3, left: 22, right: 22, bottom: 42, flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: '#30254D', borderWidth: 1, borderColor: '#63508D', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: ui.foreground, fontSize: 11, fontWeight: '700' },
});
