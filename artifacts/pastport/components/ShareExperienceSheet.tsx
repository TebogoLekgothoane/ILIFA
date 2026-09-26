import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PlaceConnection, PeopleExperience } from '@/data/peoplesExperiences';
import type { ShareExperienceMode } from '@/components/ShareExperiencePrompt';
import { initialsFromName } from '@/lib/peoplesExperiences';
import { station } from '@/data/pastport';
import { ui } from '@/components/PastportUI';

const connections: PlaceConnection[] = ['Visitor', 'Resident', 'Former Resident', 'Historian', 'Community Member'];

type ShareExperienceSheetProps = {
  mode: ShareExperienceMode;
  siteId: string;
  onClose: () => void;
  onSubmit: (experience: PeopleExperience) => void;
};

export function ShareExperienceSheet({ mode, siteId, onClose, onSubmit }: ShareExperienceSheetProps) {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [connection, setConnection] = useState<PlaceConnection>(mode === 'story' ? 'Community Member' : 'Visitor');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<{ uri: string }[]>([]);
  const [videoUri, setVideoUri] = useState<string | undefined>();

  useEffect(() => {
    if (mode === 'photos') void pickMedia('images');
    if (mode === 'video') void pickMedia('videos');
  }, [mode]);

  async function pickMedia(mediaTypes: 'images' | 'videos') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypes === 'images' ? ['images'] : ['videos'],
      allowsMultipleSelection: mediaTypes === 'images',
      quality: 0.8,
    });
    if (result.canceled) return;
    if (mediaTypes === 'videos') {
      setVideoUri(result.assets[0]?.uri);
      return;
    }
    setPhotos(result.assets.map((asset) => ({ uri: asset.uri })));
  }

  function submit() {
    const name = displayName.trim() || 'You';
    const quote = body.trim() || title.trim() || 'A memory from this place.';
    const kind = mode === 'story' ? 'community' : 'visitor';
    const now = new Date();
    onSubmit({
      id: `shared-${now.getTime()}`,
      siteId,
      displayName: name,
      initials: initialsFromName(name),
      avatarColor: '#B99CFF',
      storykeeper: mode === 'story',
      dateLabel: `Visited ${now.toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}`,
      sortKey: now.toISOString().slice(0, 10),
      placeLabel: station.area.split(',')[0],
      connection,
      kind,
      title: title.trim() || undefined,
      quote,
      body: body.trim() || quote,
      language: 'English',
      languageCode: 'en',
      verification: kind === 'community' ? 'community-memory' : 'visitor-shared',
      verificationLabel: kind === 'community' ? 'Community Memory · Shared with ILIFA' : 'Experience shared by visitor',
      coordinates: {
        latitude: station.coordinates.latitude + 0.0004,
        longitude: station.coordinates.longitude + 0.0005,
      },
      photos,
      videoUrl: videoUri,
      userSubmitted: true,
    });
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose} testID="share-experience-sheet">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{modeHeading(mode)}</Text>
              <Text style={styles.title}>Add your voice to this place</Text>
            </View>
            <Pressable testID="share-experience-close" onPress={onClose} style={styles.close}>
              <Feather name="x" size={18} color={ui.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              testID="share-experience-name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="First name or preferred name"
              placeholderTextColor={ui.mutedForeground}
              style={styles.input}
            />

            <Text style={styles.label}>Your connection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connections}>
              {connections.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setConnection(item)}
                  style={[styles.connection, connection === item && styles.connectionActive]}
                >
                  <Text style={[styles.connectionText, connection === item && styles.connectionTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {mode === 'story' ? (
              <>
                <Text style={styles.label}>Story title</Text>
                <TextInput
                  testID="share-experience-title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Growing up around this area"
                  placeholderTextColor={ui.mutedForeground}
                  style={styles.input}
                />
              </>
            ) : null}

            <Text style={styles.label}>{mode === 'write' ? 'Your experience' : 'What do you remember?'}</Text>
            <TextInput
              testID="share-experience-body"
              value={body}
              onChangeText={setBody}
              placeholder="A memory, a feeling, or something you discovered here."
              placeholderTextColor={ui.mutedForeground}
              style={[styles.input, styles.bodyInput]}
              multiline
            />

            <View style={styles.mediaActions}>
              <Pressable testID="share-experience-pick-photos" onPress={() => void pickMedia('images')} style={styles.mediaButton}>
                <Feather name="camera" size={14} color={ui.primary} />
                <Text style={styles.mediaText}>{photos.length ? `${photos.length} photos` : 'Add photos'}</Text>
              </Pressable>
              <Pressable testID="share-experience-pick-video" onPress={() => void pickMedia('videos')} style={styles.mediaButton}>
                <Feather name="video" size={14} color={ui.primary} />
                <Text style={styles.mediaText}>{videoUri ? 'Video attached' : 'Add video'}</Text>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
                {photos.map((photo) => (
                  <Image key={photo.uri} source={photo} style={styles.preview} />
                ))}
              </ScrollView>
            ) : null}

            <Pressable testID="share-experience-submit" onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
              <Text style={styles.submitText}>Share with ILIFA</Text>
              <Feather name="arrow-up-right" size={16} color="#0B0A13" />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function modeHeading(mode: ShareExperienceMode): string {
  if (mode === 'story') return 'SHARE A STORY';
  if (mode === 'photos') return 'ADD PHOTOS';
  if (mode === 'video') return 'ADD VIDEO';
  return 'WRITE EXPERIENCE';
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,3,12,0.62)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#141225',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#5B4A86',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#6B5A96', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#C9C3D6', fontSize: 11, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3E3762',
    backgroundColor: '#1B1832',
    color: ui.foreground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  bodyInput: { minHeight: 110, textAlignVertical: 'top' },
  connections: { gap: 8, paddingRight: 8 },
  connection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#241F40',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  connectionActive: { borderColor: ui.primary, backgroundColor: 'rgba(185,156,255,0.16)' },
  connectionText: { color: ui.mutedForeground, fontSize: 11, fontWeight: '700' },
  connectionTextActive: { color: ui.foreground },
  mediaActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  mediaButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#241F40',
    borderWidth: 1,
    borderColor: '#68549A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaText: { color: ui.foreground, fontSize: 12, fontWeight: '700' },
  previewRow: { gap: 8, marginTop: 12 },
  preview: { width: 84, height: 64, borderRadius: 12, backgroundColor: '#2A2345' },
  submit: {
    minHeight: 52,
    marginTop: 18,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: ui.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  submitText: { color: '#0B0A13', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
