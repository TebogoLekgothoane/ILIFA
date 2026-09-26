import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PeopleExperience } from '@/data/peoplesExperiences';
import { ui } from '@/components/PastportUI';

type PeopleExperienceCardProps = {
  experience: PeopleExperience;
  onPress: () => void;
};

export function PeopleExperienceCard({ experience, onPress }: PeopleExperienceCardProps) {
  const previewPhoto = experience.photos[0];
  const extraPhotos = Math.max(0, experience.photos.length - 1);
  const showVideo = Boolean(experience.videoUrl);

  return (
    <Pressable
      testID={`people-experience-card-${experience.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, experience.storykeeper && styles.cardFeatured, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        {experience.avatarImage ? (
          <Image source={experience.avatarImage} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: experience.avatarColor }]}>
            <Text style={styles.initials}>{experience.initials}</Text>
          </View>
        )}
        <View style={styles.identity}>
          <Text style={styles.name}>{experience.displayName}</Text>
          {experience.storykeeper ? (
            <View style={styles.storykeeper}>
              <View style={styles.storykeeperDot} />
              <Text style={styles.storykeeperText}>Community Storykeeper</Text>
            </View>
          ) : (
            <View style={styles.visitRow}>
              <Feather name="map-pin" size={11} color={ui.accent} />
              <Text style={styles.visitText}>{experience.dateLabel}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {experience.placeLabel} · {experience.connection}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          {experience.title ? (
            <View style={styles.titleRow}>
              {experience.audioUrl ? <Feather name="headphones" size={14} color={ui.primary} /> : null}
              <Text style={styles.title}>“{experience.title}”</Text>
            </View>
          ) : null}
          <Text style={styles.quote} numberOfLines={4}>
            “{experience.quote}”
          </Text>
        </View>

        {showVideo && experience.videoUrl ? (
          <View style={styles.mediaPreview} testID={`people-experience-photos-${experience.id}`}>
            <CardVideoPreview url={experience.videoUrl} />
          </View>
        ) : previewPhoto ? (
          <View style={styles.mediaPreview} testID={`people-experience-photos-${experience.id}`}>
            <Image source={previewPhoto} style={styles.photo} />
            {extraPhotos > 0 ? (
              <View style={styles.photoMore}>
                <Text style={styles.photoMoreText}>+{extraPhotos}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.mediaRow}>
        {experience.audioUrl ? (
          <View style={styles.chip}>
            <Feather name="play" size={11} color={ui.foreground} />
            <Text style={styles.chipText}>Listen to full story</Text>
          </View>
        ) : null}
        {experience.videoUrl ? (
          <View style={styles.chip}>
            <Feather name="video" size={11} color={ui.foreground} />
            <Text style={styles.chipText}>Video</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <Text style={styles.chipText}>{experience.language}</Text>
        </View>
      </View>

      <Text style={styles.verification}>{experience.verificationLabel}</Text>
    </Pressable>
  );
}

function CardVideoPreview({ url }: { url: string | number }) {
  const player = useVideoPlayer(url, (next) => {
    next.loop = true;
    next.muted = true;
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <View style={styles.videoWrap} testID="people-experience-card-video">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <View style={styles.videoBadge}>
        <Feather name="play" size={11} color="#0B0A13" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16142C',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  cardFeatured: {
    backgroundColor: '#191433',
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2A2345',
  },
  initials: { color: '#100D1B', fontSize: 14, fontWeight: '800' },
  identity: { flex: 1 },
  name: { color: ui.foreground, fontSize: 16, fontWeight: '700' },
  storykeeper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  storykeeperDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.primary },
  storykeeperText: { color: ui.primary, fontSize: 11, fontWeight: '700' },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  visitText: { color: '#D2CDDB', fontSize: 11, fontWeight: '600' },
  meta: { color: ui.mutedForeground, fontSize: 12, marginTop: 4 },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: ui.foreground, fontSize: 15, fontWeight: '700', flex: 1 },
  quote: { color: '#D8D3E4', fontSize: 14, lineHeight: 21, marginTop: 8 },
  mediaPreview: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  photo: {
    width: 86,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#2A2345',
  },
  videoWrap: {
    width: 86,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#090814',
  },
  videoBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ui.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMore: {
    width: 40,
    height: 40,
    backgroundColor: '#242040',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMoreText: { color: ui.foreground, fontSize: 12, fontWeight: '800' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#242040',
  },
  chipText: { color: ui.foreground, fontSize: 10, fontWeight: '700' },
  verification: { color: ui.accent, fontSize: 11, fontWeight: '600', marginTop: 14 },
  pressed: { opacity: 0.82 },
});
