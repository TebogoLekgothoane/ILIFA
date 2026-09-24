import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ui } from '@/components/PastportUI';

type ArRecognitionProps = {
  phase: 'scanning' | 'detected';
  fullScreen?: boolean;
};

export function ArRecognition({ phase, fullScreen = false }: ArRecognitionProps) {
  const { height } = useWindowDimensions();
  const scan = useRef(new Animated.Value(0)).current;
  const travel = fullScreen ? Math.max(320, height - 48) : Math.max(220, height - 160);
  const scanStart = fullScreen ? 8 : 24;

  useEffect(() => {
    if (phase !== 'scanning') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, scan]);

  const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [scanStart, travel] });

  return (
    <View style={[styles.frame, fullScreen && styles.fullScreen]} testID="ar-recognition">
      <View style={[styles.bracket, styles.topLeft, fullScreen && styles.bracketLarge, fullScreen && styles.topLeftFull]} />
      <View style={[styles.bracket, styles.topRight, fullScreen && styles.bracketLarge, fullScreen && styles.topRightFull]} />
      <View style={[styles.bracket, styles.bottomLeft, fullScreen && styles.bracketLarge, fullScreen && styles.bottomLeftFull]} />
      <View style={[styles.bracket, styles.bottomRight, fullScreen && styles.bracketLarge, fullScreen && styles.bottomRightFull]} />
      {phase === 'scanning' ? (
        <>
          <Animated.View style={[styles.scanLine, fullScreen && styles.scanLineFull, { transform: [{ translateY }] }]} />
          <View style={[styles.copyBlock, fullScreen && styles.copyBlockFull]}>
            <Text style={styles.eyebrow}>AI SCANNING</Text>
            <Text style={styles.title}>Reading the building</Text>
            <Text style={styles.copy}>Hold steady while the view is matched to the archive.</Text>
          </View>
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
  fullScreen: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'rgba(7,7,17,0.28)',
  },
  bracket: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(214,196,255,0.95)' },
  bracketLarge: { width: 42, height: 42, borderColor: 'rgba(214,196,255,0.98)' },
  topLeft: { top: 14, left: 14, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 14, right: 14, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 14, left: 14, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 14, right: 14, borderBottomWidth: 2, borderRightWidth: 2 },
  topLeftFull: { top: 18, left: 16 },
  topRightFull: { top: 18, right: 16 },
  bottomLeftFull: { bottom: 18, left: 16 },
  bottomRightFull: { bottom: 18, right: 16 },
  scanLine: { position: 'absolute', top: 0, left: 28, right: 28, height: 2, backgroundColor: 'rgba(185,156,255,0.9)', shadowColor: ui.primary, shadowOpacity: 0.8, shadowRadius: 8 },
  scanLineFull: { left: 16, right: 16, height: 3 },
  copyBlock: { alignItems: 'center', paddingHorizontal: 18 },
  copyBlockFull: { paddingHorizontal: 28 },
  detected: { alignItems: 'center' },
  check: { width: 36, height: 36, borderRadius: 18, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  eyebrow: { color: '#EDC48C', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textAlign: 'center' },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  copy: { color: '#D5D0DE', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
});
