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
      // RN cannot load GLB-embedded textures via Blob URLs; strip maps and keep solid PBR colors.
      const binary = stripGlbTextures(base64ToArrayBuffer(base64));
      const loaded = await Promise.race([
        new Promise<any>((resolve, reject) => new GLTFLoader().parse(binary, '', resolve, reject)),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Model load timed out.')), 15000)),
      ]);
      const model = loaded.scene;
      fitModelInView(model, camera);
      modelRef.current = model;
      scene.add(model);
      onLoadingChange?.(false);

      const render = () => {
        frame = requestAnimationFrame(render);
        const next = transformRef.current;
        const modelOpacity = opacityRef.current;
        model.position.set(
          model.userData.fitPosition[0] + next.position[0],
          model.userData.fitPosition[1] + next.position[1],
          model.userData.fitPosition[2] + next.position[2],
        );
        model.rotation.set(...next.rotation);
        model.scale.setScalar(model.userData.fitScale * next.scale);
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

function fitModelInView(model: any, camera: any) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  // Fill the stage viewport; camera distance ~4.8 / FOV 42° → ~3.7 visible height.
  const fitScale = 7.6 / maxDim;
  model.userData.fitScale = fitScale;
  model.userData.fitPosition = [-center.x * fitScale, -center.y * fitScale + 0.55, -center.z * fitScale];
  model.scale.setScalar(fitScale);
  model.position.set(...model.userData.fitPosition);
  camera.near = 0.01;
  camera.far = Math.max(100, maxDim * fitScale * 20);
  camera.updateProjectionMatrix();
}

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

function decodeGlbJson(arrayBuffer: ArrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 12 || view.getUint32(0, true) !== 0x46546c67) {
    throw new Error('Invalid GLB header.');
  }

  const totalLength = view.getUint32(8, true);
  let offset = 12;
  let json: any = null;
  let bin: Uint8Array | null = null;

  while (offset + 8 <= totalLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    const chunk = new Uint8Array(arrayBuffer, offset, chunkLength);
    offset += chunkLength;

    if (chunkType === 0x4e4f534a) {
      let text = '';
      for (let i = 0; i < chunk.length; i++) text += String.fromCharCode(chunk[i]);
      json = JSON.parse(text.replace(/\0+$/, ''));
    } else if (chunkType === 0x004e4942) {
      bin = chunk.slice();
    }
  }

  if (!json) throw new Error('GLB is missing a JSON chunk.');
  return { json, bin };
}

function encodeGlb(json: any, bin: Uint8Array | null) {
  const jsonText = JSON.stringify(json);
  const jsonBytes = new Uint8Array(jsonText.length);
  for (let i = 0; i < jsonText.length; i++) jsonBytes[i] = jsonText.charCodeAt(i) & 0xff;

  const jsonChunkLength = (jsonBytes.byteLength + 3) & ~3;
  const jsonChunk = new Uint8Array(jsonChunkLength);
  jsonChunk.set(jsonBytes);
  jsonChunk.fill(0x20, jsonBytes.byteLength);

  const binBytes = bin ?? new Uint8Array(0);
  const binChunkLength = (binBytes.byteLength + 3) & ~3;
  const binChunk = new Uint8Array(binChunkLength);
  binChunk.set(binBytes);

  const totalLength = 12 + 8 + jsonChunkLength + (bin ? 8 + binChunkLength : 0);
  const out = new ArrayBuffer(totalLength);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);

  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonChunkLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(jsonChunk, 20);

  if (bin) {
    const binHeader = 20 + jsonChunkLength;
    view.setUint32(binHeader, binChunkLength, true);
    view.setUint32(binHeader + 4, 0x004e4942, true);
    bytes.set(binChunk, binHeader + 8);
  }

  return out;
}

/** Drop image/texture maps so GLTFLoader never hits RN's Blob limitation. */
function stripGlbTextures(arrayBuffer: ArrayBuffer) {
  const { json, bin } = decodeGlbJson(arrayBuffer);
  if (!json.images?.length && !json.textures?.length) return arrayBuffer;

  for (const material of json.materials ?? []) {
    const pbr = material.pbrMetallicRoughness;
    if (!pbr) continue;
    delete pbr.baseColorTexture;
    delete pbr.metallicRoughnessTexture;
    delete material.normalTexture;
    delete material.occlusionTexture;
    delete material.emissiveTexture;
  }

  delete json.images;
  delete json.textures;
  return encodeGlb(json, bin);
}
