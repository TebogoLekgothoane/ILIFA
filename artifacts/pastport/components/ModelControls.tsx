import React, { useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { ModelTransform } from '@/components/HistoricalModel';
import { ui } from '@/components/PastportUI';

type ModelControlsProps = {
  aligning: boolean;
  opacity: number;
  transform: ModelTransform;
  onAlign: () => void;
  onOpacityChange: (value: number) => void;
  onReset: () => void;
  onTransformChange: (value: ModelTransform) => void;
};

export function ModelControls({ aligning, opacity, transform, onAlign, onOpacityChange, onReset, onTransformChange }: ModelControlsProps) {
  const gestureStart = useRef<{ transform: ModelTransform; distance: number; angle: number } | null>(null);
  const [sliderWidth, setSliderWidth] = useState(1);

  const modelPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: () => aligning,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      gestureStart.current = {
        transform,
        distance: touches.length > 1 ? distance(touches[0], touches[1]) : 0,
        angle: touches.length > 1 ? angle(touches[0], touches[1]) : 0,
      };
    },
    onPanResponderMove: (event, gesture) => {
      const start = gestureStart.current;
      if (!start) return;
      const touches = event.nativeEvent.touches;
      if (touches.length > 1) {
        const nextDistance = distance(touches[0], touches[1]);
        const nextAngle = angle(touches[0], touches[1]);
        const scaleFactor = start.distance ? nextDistance / start.distance : 1;
        onTransformChange({
          ...start.transform,
          scale: clamp(start.transform.scale * scaleFactor, 0.02, 0.28),
          rotation: [start.transform.rotation[0], start.transform.rotation[1] + (nextAngle - start.angle), start.transform.rotation[2]],
        });
        return;
      }
      onTransformChange({
        ...start.transform,
        position: [start.transform.position[0] + gesture.dx * 0.006, start.transform.position[1] - gesture.dy * 0.006, start.transform.position[2]],
      });
    },
    onPanResponderRelease: () => { gestureStart.current = null; },
    onPanResponderTerminate: () => { gestureStart.current = null; },
  }), [aligning, onTransformChange, transform]);

  function setOpacityFromTouch(locationX: number) {
    onOpacityChange(clamp(locationX / sliderWidth, 0, 1));
  }

  return (
    <>
      {aligning ? <View testID="model-gesture-area" style={styles.gestureArea} {...modelPanResponder.panHandlers}><View style={styles.alignHint}><Feather name="move" size={15} color={ui.primary} /><Text style={styles.alignHintText}>Drag to move · pinch to scale · two fingers to rotate</Text></View></View> : null}
      <View style={styles.controls}>
        <View style={styles.opacityHeader}><Text style={styles.controlLabel}>PAST</Text><Text style={styles.opacityValue}>{Math.round(opacity * 100)}%</Text><Text style={styles.controlLabel}>NOW</Text></View>
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
          <View style={[styles.sliderThumb, { left: `${opacity * 100}%` }]} />
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onReset} style={styles.controlButton}><Feather name="rotate-ccw" size={14} color={ui.foreground} /><Text style={styles.controlButtonText}>Reset</Text></Pressable>
          <Pressable onPress={onAlign} style={[styles.controlButton, aligning && styles.controlButtonActive]}><Feather name="move" size={14} color={aligning ? '#100D1B' : ui.primary} /><Text style={[styles.controlButtonText, aligning && styles.controlButtonTextActive]}>{aligning ? 'Done aligning' : 'Align'}</Text></Pressable>
        </View>
        <Text style={styles.disclosure}>{aligning ? 'Prototype AR alignment — move the reconstruction until it matches the building.' : 'Historical reconstruction'}</Text>
      </View>
    </>
  );
}

function distance(first: { pageX: number; pageY: number }, second: { pageX: number; pageY: number }) {
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

function angle(first: { pageX: number; pageY: number }, second: { pageX: number; pageY: number }) {
  return Math.atan2(second.pageY - first.pageY, second.pageX - first.pageX);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  gestureArea: { ...StyleSheet.absoluteFill, zIndex: 6 },
  alignHint: { position: 'absolute', top: '27%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(12,10,27,0.86)', borderWidth: 1, borderColor: '#8E76D4' },
  alignHintText: { color: ui.foreground, fontSize: 10, fontWeight: '600' },
  controls: { position: 'absolute', zIndex: 7, left: 18, right: 18, bottom: 170, borderRadius: 18, padding: 13, backgroundColor: 'rgba(17,14,34,0.92)', borderWidth: 1, borderColor: '#514275' },
  opacityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlLabel: { color: '#A49DB8', fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  opacityValue: { color: ui.foreground, fontSize: 11, fontWeight: '700' },
  sliderTrack: { height: 5, borderRadius: 3, backgroundColor: '#3B3353', marginTop: 10, justifyContent: 'center' },
  sliderFill: { height: 5, borderRadius: 3, backgroundColor: ui.primary },
  sliderThumb: { position: 'absolute', width: 16, height: 16, marginLeft: -8, borderRadius: 8, backgroundColor: '#F5EDFF', borderWidth: 3, borderColor: ui.primary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  controlButton: { flex: 1, minHeight: 38, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, borderRadius: 12, backgroundColor: '#2A2345', borderWidth: 1, borderColor: '#5E4D89' },
  controlButtonActive: { backgroundColor: ui.primary, borderColor: ui.primary },
  controlButtonText: { color: ui.foreground, fontSize: 11, fontWeight: '700' },
  controlButtonTextActive: { color: '#100D1B' },
  disclosure: { color: '#A49DB8', fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 10 },
});
