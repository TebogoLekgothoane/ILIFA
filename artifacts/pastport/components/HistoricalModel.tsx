import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { GLView } from 'expo-gl';
import { Renderer, THREE } from 'expo-three';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { station1950Model } from '@/lib/historicalModels';

export type ModelTransform = {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

type HistoricalModelProps = {
  visible: boolean;
  opacity: number;
  transform: ModelTransform;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (message: string) => void;
};

export function HistoricalModel({ visible, opacity, transform, onLoadingChange, onError }: HistoricalModelProps) {
  const modelRef = useRef<any>(null);
  const transformRef = useRef(transform);
  const opacityRef = useRef(opacity);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  const onContextCreate = useCallback(async (gl: any) => {
    let frame = 0;
    try {
      (globalThis as any).THREE = (globalThis as any).THREE || THREE;
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 1000);
      camera.position.set(0, 1.2, 4.8);
      scene.add(new THREE.AmbientLight(0xffffff, 1.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(4, 6, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xc9b4ff, 0.75);
      fillLight.position.set(-4, 3, 2);
      scene.add(fillLight);

      onLoadingChange?.(true);
      const asset = Asset.fromModule(station1950Model.model);
      await asset.downloadAsync();
      if (!asset.localUri) throw new Error('The bundled historical model could not be materialized.');
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
      const binary = base64ToArrayBuffer(base64);
      const loaded = await new Promise<any>((resolve, reject) => new GLTFLoader().parse(binary, '', resolve, reject));
      const model = loaded.scene;
      modelRef.current = model;
      scene.add(model);
      onLoadingChange?.(false);

      const render = () => {
        frame = requestAnimationFrame(render);
        const next = transformRef.current;
        const modelOpacity = opacityRef.current;
        model.position.set(...next.position);
        model.rotation.set(...next.rotation);
        model.scale.setScalar(next.scale);
        model.traverse((child: any) => {
          if (!child.isMesh) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material: any) => {
            material.transparent = modelOpacity < 1;
            material.opacity = modelOpacity;
            material.needsUpdate = true;
          });
        });
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    } catch (error) {
      onLoadingChange?.(false);
      onError?.(error instanceof Error ? error.message : 'Unable to load the historical reconstruction.');
    }

    return () => cancelAnimationFrame(frame);
  }, [onError, onLoadingChange]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
});

function base64ToArrayBuffer(base64: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const character of clean) {
    buffer = (buffer << 6) | alphabet.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.buffer;
}
