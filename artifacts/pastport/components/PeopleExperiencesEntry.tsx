import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

type PeopleExperiencesEntryProps = {
  nearby: number;
  onPress: () => void;
};

export function PeopleExperiencesEntry({ nearby, onPress }: PeopleExperiencesEntryProps) {
  return (
    <Pressable testID="people-experiences-entry" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>PEOPLE WHO EXPERIENCED THIS PLACE</Text>
        <Text style={styles.title}>{nearby} experiences nearby</Text>
        <Text style={styles.line}>History tells you what happened. People tell you what it means.</Text>
      </View>
      <View style={styles.arrow}>
        <Feather name="users" size={16} color="#0B0A13" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(21,18,42,0.92)',
    borderWidth: 1,
    borderColor: '#6B57A8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copy: { flex: 1 },
  eyebrow: { color: '#EDC48C', fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  title: { color: ui.foreground, fontSize: 13, fontWeight: '700', marginTop: 3 },
  line: { color: '#D1CCD9', fontSize: 10, marginTop: 2 },
  arrow: { width: 32, height: 32, borderRadius: 12, backgroundColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
});
