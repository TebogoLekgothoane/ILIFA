import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PeopleExperience } from '@/data/peoplesExperiences';
import { ui } from '@/components/PastportUI';

type PeopleExperienceSheetProps = {
  experience: PeopleExperience;
  onClose: () => void;
};

export function PeopleExperienceSheet({ experience, onClose }: PeopleExperienceSheetProps) {
  const insets = useSafeAreaInsets();
  const [showTranslation, setShowTranslation] = useState(false);
  const story = showTranslation && experience.translation ? experience.translation : experience.body;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose} testID="people-experience-sheet">
      <View style={styles.overlay}>
        <Pressable testID="people-experience-backdrop" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            {experience.avatarImage ? (
              <Image source={experience.avatarImage} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: experience.avatarColor }]}>
                <Text style={styles.initials}>{experience.initials}</Text>
              </View>
            )}
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{experience.storykeeper ? 'COMMUNITY STORYKEEPER' : experience.connection.toUpperCase()}</Text>
              <Text style={styles.name}>{experience.displayName}</Text>
              <Text style={styles.meta}>
                {experience.placeLabel} · {experience.dateLabel}
              </Text>
            </View>
            <Pressable testID="people-experience-close" onPress={onClose} hitSlop={10} style={styles.close}>
              <Feather name="x" size={18} color={ui.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {experience.title ? <Text style={styles.title}>“{experience.title}”</Text> : null}
            <Text style={styles.story}>{story}</Text>

            <View style={styles.languageRow}>
              <Text style={styles.language}>Original language · {experience.language}</Text>
              {experience.translation ? (
                <Pressable testID="people-experience-translation" onPress={() => setShowTranslation((current) => !current)}>
                  <Text style={styles.translationAction}>
                    {showTranslation ? 'Show original' : 'Show translation'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {experience.transcript ? <Text style={styles.transcript}>{experience.transcript}</Text> : null}
            {experience.audioUrl ? <StoryAudio url={experience.audioUrl} title={experience.audioTitle ?? experience.title ?? 'Listen to full story'} /> : null}
            {experience.videoUrl ? <StoryVideo url={experience.videoUrl} /> : null}

            {experience.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
                {experience.photos.map((photo, index) => (
                  <Image key={`${experience.id}-photo-${index}`} source={photo} style={styles.photo} />
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.verification}>{experience.verificationLabel}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StoryAudio({ url, title }: { url: number; title: string }) {
  const player = useAudioPlayer(url, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  return (
    <Pressable
      testID="people-experience-audio"
      onPress={() => (status.playing ? player.pause() : player.play())}
      style={styles.audio}
    >
      <View style={styles.audioIcon}>
        <Feather name={status.playing ? 'pause' : 'play'} size={16} color="#0B0A13" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.audioLabel}>LISTEN TO FULL STORY</Text>
        <Text style={styles.audioTitle}>{title}</Text>
      </View>
      <Feather name="headphones" size={16} color={ui.primary} />
    </Pressable>
  );
}

function StoryVideo({ url }: { url: string | number }) {
  const player = useVideoPlayer(url, (next) => {
    next.loop = false;
  });

  return (
    <View style={styles.video} testID="people-experience-video">
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,3,12,0.62)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#141225',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#5B4A86',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#6B5A96', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2A2345' },
  initials: { color: '#100D1B', fontSize: 14, fontWeight: '800' },
  headerCopy: { flex: 1 },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  name: { color: ui.foreground, fontSize: 20, fontWeight: '700', marginTop: 4 },
  meta: { color: '#C9C3D6', fontSize: 12, marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  body: { paddingBottom: 12 },
  title: { color: ui.foreground, fontSize: 18, fontWeight: '700', marginTop: 6 },
  story: { color: '#D2CDDC', fontSize: 14, lineHeight: 22, marginTop: 10 },
  languageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10 },
  language: { color: ui.mutedForeground, fontSize: 11, flex: 1 },
  translationAction: { color: ui.primary, fontSize: 11, fontWeight: '700' },
  transcript: { color: '#B8B2C6', fontSize: 12, lineHeight: 18, marginTop: 10, fontStyle: 'italic' },
  audio: {
    marginTop: 16,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#211C3C',
    borderWidth: 1,
    borderColor: '#554A85',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  audioLabel: { color: ui.accent, fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  audioTitle: { color: ui.foreground, fontSize: 13, fontWeight: '700', marginTop: 3 },
  video: { height: 196, borderRadius: 18, overflow: 'hidden', backgroundColor: '#090814', marginTop: 14 },
  photos: { gap: 8, paddingTop: 14 },
  photo: { width: 148, height: 108, borderRadius: 16, backgroundColor: '#2A2345' },
  verification: { color: ui.accent, fontSize: 12, fontWeight: '600', marginTop: 16 },
});
