import React, { useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { PanResponder, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ModelTransform } from '@/components/HistoricalModel';
import { ui } from '@/components/PastportUI';

type ModelOrbitSurfaceProps = {
  transform: ModelTransform;
  onTransformChange: (value: ModelTransform) => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ModelOrbitSurface({ transform, onTransformChange, children, style }: ModelOrbitSurfaceProps) {
  const transformRef = useRef(transform);
  const onChangeRef = useRef(onTransformChange);
  const gestureStart = useRef<{ transform: ModelTransform; distance: number } | null>(null);
  transformRef.current = transform;
  onChangeRef.current = onTransformChange;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      gestureStart.current = {
        transform: transformRef.current,
        distance: touches.length > 1 ? distance(touches[0], touches[1]) : 0,
      };
    },
    onPanResponderMove: (event, gesture) => {
      const start = gestureStart.current;
      if (!start) return;
      const touches = event.nativeEvent.touches;
      if (touches.length > 1 && start.distance) {
        const nextDistance = distance(touches[0], touches[1]);
        onChangeRef.current({
          ...start.transform,
          scale: clamp(start.transform.scale * (nextDistance / start.distance), 0.35, 2.5),
        });
        return;
      }
      onChangeRef.current({
        ...start.transform,
        rotation: [
          clamp(start.transform.rotation[0] + gesture.dy * 0.007, -0.9, 0.9),
          start.transform.rotation[1] + gesture.dx * 0.012,
          start.transform.rotation[2],
        ],
      });
    },
    onPanResponderRelease: () => { gestureStart.current = null; },
    onPanResponderTerminate: () => { gestureStart.current = null; },
  }), []);

  return <View collapsable={false} testID="model-gesture-area" style={style} {...panResponder.panHandlers}>{children}</View>;
}

type ModelControlsProps = {
  opacity: number;
  onOpacityChange: (value: number) => void;
  onReset: () => void;
  onTurn: (direction: -1 | 1) => void;
};

export function ModelControls({ opacity, onOpacityChange, onReset, onTurn }: ModelControlsProps) {
  const [sliderWidth, setSliderWidth] = useState(1);

  function setOpacityFromTouch(locationX: number) {
    onOpacityChange(clamp(locationX / sliderWidth, 0, 1));
  }

  return (
    <View style={styles.controls}>
      <View style={styles.turnRow}>
        <Pressable onPress={() => onTurn(-1)} style={styles.iconButton} accessibilityLabel="Turn left"><Feather name="rotate-ccw" size={14} color={ui.foreground} /></Pressable>
        <Text style={styles.hint}>Drag to turn the station</Text>
        <Pressable onPress={() => onTurn(1)} style={styles.iconButton} accessibilityLabel="Turn right"><Feather name="rotate-cw" size={14} color={ui.foreground} /></Pressable>
        <Pressable onPress={onReset} style={styles.iconButton} accessibilityLabel="Reset view"><Feather name="refresh-cw" size={14} color={ui.primary} /></Pressable>
      </View>
      <View style={styles.opacityRow}>
        <Text style={styles.controlLabel}>PAST</Text>
        <View
          testID="historical-opacity-slider"
          style={styles.sliderTrack}
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => setOpacityFromTouch(event.nativeEvent.locationX)}
          onResponderMove={(event) => setOpacityFromTouch(event.nativeEvent.locationX)}
        >
          <View style={[styles.sliderFill, { width: `${opacity * 100}%` }]} />
        </View>
        <Text style={styles.controlLabel}>NOW</Text>
      </View>
    </View>
  );
}

function distance(first: { pageX: number; pageY: number }, second: { pageX: number; pageY: number }) {
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8, backgroundColor: 'rgba(12,10,24,0.72)' },
  turnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hint: { flex: 1, color: '#C9C3D6', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  iconButton: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#2A2345', borderWidth: 1, borderColor: '#5E4D89', alignItems: 'center', justifyContent: 'center' },
  opacityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  controlLabel: { color: '#A49DB8', fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  sliderTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#3B3353', justifyContent: 'center' },
  sliderFill: { height: 5, borderRadius: 3, backgroundColor: ui.primary },
});
