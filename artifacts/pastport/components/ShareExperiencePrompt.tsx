import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

export type ShareExperienceMode = 'story' | 'photos' | 'video' | 'write';

type ShareExperiencePromptProps = {
  onShare: (mode: ShareExperienceMode) => void;
};

const actions: { mode: ShareExperienceMode; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { mode: 'story', icon: 'mic', label: 'Share a Story' },
  { mode: 'photos', icon: 'camera', label: 'Add Photos' },
  { mode: 'video', icon: 'video', label: 'Add Video' },
  { mode: 'write', icon: 'edit-3', label: 'Write Experience' },
];

export function ShareExperiencePrompt({ onShare }: ShareExperiencePromptProps) {
  return (
    <View style={styles.card} testID="share-experience-prompt">
      <Text style={styles.eyebrow}>YOUR VOICE BELONGS HERE</Text>
      <Text style={styles.title}>What was your experience?</Text>
      <Text style={styles.copy}>Add your voice to the history of this place.</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.mode}
            testID={`share-experience-${action.mode}`}
            onPress={() => onShare(action.mode)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <View style={styles.icon}>
              <Feather name={action.icon} size={16} color={ui.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181433',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#5B4A86',
    marginTop: 8,
  },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 8 },
  copy: { color: '#C9C3D6', fontSize: 14, lineHeight: 20, marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  action: {
    width: '48%',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#241F40',
    borderWidth: 1,
    borderColor: '#68549A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#31295A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: ui.foreground, fontSize: 11, fontWeight: '700', flex: 1 },
  pressed: { opacity: 0.78 },
});
