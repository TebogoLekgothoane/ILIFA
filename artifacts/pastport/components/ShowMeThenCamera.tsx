// Demo mode: play a recorded location video instead of the live device camera.
// import { Feather } from '@expo/vector-icons';
// import { CameraView } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import demoCameraVideo from '@/assets/audio/WhatsApp Video 2026-09-25 at 00.26.07.mp4';
// import { ui } from '@/components/PastportUI';

type ShowMeThenCameraProps = {
  granted: boolean;
  canAskAgain?: boolean;
  error: string | null;
  onMountError: (event: { message: string }) => void;
  onRequestAccess: () => void;
};

export function ShowMeThenCamera(_props: ShowMeThenCameraProps) {
  // Live camera (commented out for the demo background video):
  // if (granted && !error) {
  //   return <CameraView style={styles.camera} facing="back" onMountError={onMountError} />;
  // }
  // return (
  //   <View style={styles.fallback}>
  //     <Feather name="camera-off" size={24} color={ui.primary} />
  //     <Text style={styles.title}>{error ? 'Camera unavailable' : 'Camera access is needed to experience the past.'}</Text>
  //     <Text style={styles.copy}>{error || 'Enable the live camera to place the reconstruction over the real location.'}</Text>
  //     <Pressable onPress={onRequestAccess} style={styles.button}>
  //       <Text style={styles.buttonText}>{canAskAgain === false ? 'Open camera settings' : 'Enable Camera'}</Text>
  //     </Pressable>
  //   </View>
  // );

  const player = useVideoPlayer(demoCameraVideo, (next) => {
    next.loop = true;
    next.muted = true;
  });

  useEffect(() => {
    player.play();
    return () => {
      try {
        player.pause();
      } catch {
        // Ignore cleanup errors when leaving the experience.
      }
    };
  }, [player]);

  return (
    <View style={styles.camera} testID="camera-view">
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', backgroundColor: '#070711' },
  // fallback: { ...StyleSheet.absoluteFill, zIndex: 2, backgroundColor: '#0D0C1B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  // title: { color: ui.foreground, fontSize: 21, fontWeight: '700', textAlign: 'center', marginTop: 15 },
  // copy: { color: ui.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  // button: { backgroundColor: ui.primary, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  // buttonText: { color: '#0B0A13', fontSize: 12, fontWeight: '700' },
});
