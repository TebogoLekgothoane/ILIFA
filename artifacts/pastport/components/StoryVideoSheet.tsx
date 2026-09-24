import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryAd } from '@/components/StoryAds';
import { ui } from '@/components/PastportUI';

type StoryVideoSheetProps = {
  story: StoryAd;
  onClose: () => void;
};

export function StoryVideoSheet({ story, onClose }: StoryVideoSheetProps) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(story.videoUrl, (next) => {
    next.loop = false;
  });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose} testID="story-video-sheet">
      <View style={styles.overlay}>
        <Pressable testID="story-sheet-backdrop" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>LOCAL VOICE</Text>
              <Text style={styles.title}>{story.title}</Text>
            </View>
            <Pressable testID="story-sheet-close" onPress={onClose} hitSlop={10} style={styles.close}>
              <Feather name="x" size={18} color={ui.foreground} />
            </Pressable>
          </View>

          <View style={styles.player}>
            <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="cover" />
          </View>

          <View style={styles.speaker}>
            <Image source={story.image} style={styles.avatar} />
            <View style={styles.speakerCopy}>
              <Text style={styles.speakerName}>{story.speaker}</Text>
              <Text style={styles.speakerRole}>{story.speakerRole}</Text>
            </View>
          </View>
          <Text style={styles.detail}>{story.detail}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,3,12,0.62)' },
  sheet: { backgroundColor: '#141225', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: '#5B4A86', paddingHorizontal: 16, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#6B5A96', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  player: { height: 210, borderRadius: 18, overflow: 'hidden', backgroundColor: '#090814' },
  speaker: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2A2345' },
  speakerCopy: { flex: 1 },
  speakerName: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  speakerRole: { color: '#C9C3D6', fontSize: 11, marginTop: 3 },
  detail: { color: '#D2CDDC', fontSize: 13, lineHeight: 19, marginTop: 12 },
});
