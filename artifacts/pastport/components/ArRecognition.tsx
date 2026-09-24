import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

type ArRecognitionProps = {
  phase: 'scanning' | 'detected';
};

export function ArRecognition({ phase }: ArRecognitionProps) {
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'scanning') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, scan]);

  const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [18, 150] });

  return (
    <View style={styles.frame} testID="ar-recognition">
      <View style={[styles.bracket, styles.topLeft]} />
      <View style={[styles.bracket, styles.topRight]} />
      <View style={[styles.bracket, styles.bottomLeft]} />
      <View style={[styles.bracket, styles.bottomRight]} />
      {phase === 'scanning' ? (
        <>
          <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
          <Text style={styles.eyebrow}>AI SCANNING</Text>
          <Text style={styles.title}>Reading the building</Text>
          <Text style={styles.copy}>Hold steady while the view is matched to the archive.</Text>
        </>
      ) : (
        <View style={styles.detected}>
          <View style={styles.check}><Feather name="check" size={18} color="#100D1B" /></View>
          <Text style={styles.eyebrow}>BUILDING DETECTED</Text>
          <Text style={styles.title} testID="detected-station">East London Railway Station</Text>
          <Text style={styles.copy}>Eastern Cape · 1950 reconstruction unlocked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  bracket: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(214,196,255,0.95)' },
  topLeft: { top: 14, left: 14, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 14, right: 14, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 14, left: 14, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 14, right: 14, borderBottomWidth: 2, borderRightWidth: 2 },
  scanLine: { position: 'absolute', top: 0, left: 28, right: 28, height: 2, backgroundColor: 'rgba(185,156,255,0.9)', shadowColor: ui.primary, shadowOpacity: 0.8, shadowRadius: 8 },
  detected: { alignItems: 'center' },
  check: { width: 36, height: 36, borderRadius: 18, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  eyebrow: { color: '#EDC48C', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textAlign: 'center' },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  copy: { color: '#D5D0DE', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
});
