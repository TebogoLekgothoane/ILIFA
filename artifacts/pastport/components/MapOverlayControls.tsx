import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ui } from '@/components/PastportUI';

type MapOverlayControlsProps = {
  onLocate?: () => void;
  onNavigate?: () => void;
};

export function MapOverlayControls({ onLocate, onNavigate }: MapOverlayControlsProps) {
  return (
    <>
      {onNavigate ? (
        <Pressable
          testID="map-navigate-control"
          accessibilityRole="button"
          accessibilityLabel="Start navigation"
          onPress={onNavigate}
          hitSlop={8}
          style={({ pressed }) => [styles.navigateControl, pressed && styles.pressed]}
        >
          <Feather name="navigation" size={17} color={ui.foreground} />
        </Pressable>
      ) : null}
      {onLocate ? (
        <Pressable
          testID="map-locate-control"
          accessibilityRole="button"
          accessibilityLabel="Show my location"
          onPress={onLocate}
          hitSlop={8}
          style={({ pressed }) => [styles.locateControl, pressed && styles.pressed]}
        >
          <Feather name="crosshair" size={17} color={ui.foreground} />
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  navigateControl: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#24213C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 8,
  },
  locateControl: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#24213C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 8,
  },
  pressed: { opacity: 0.75 },
});
