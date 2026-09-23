import { Canvas } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import { Suspense, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

const MODEL_ASSET = require('../assets/models/east-london-railway-station-1950.glb');

function StationModel() {
  const { scene } = useGLTF(MODEL_ASSET as never);
  const preparedScene = useMemo(() => {
    const model = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z, 0.001);

    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    model.scale.setScalar(scale);
    return model;
  }, [scene]);

  return <primitive object={preparedScene} />;
}

export function HistoricalModel({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Canvas
        camera={{ position: [0, 1.2, 4.8], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor('#000000', 0)}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} />
        <directionalLight position={[-4, 3, 2]} intensity={0.8} color="#C9B4FF" />
        <Suspense fallback={null}>
          <StationModel />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    opacity: 0.82,
  },
});

useGLTF.preload(MODEL_ASSET as never);
