import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PeopleExperiencesSection } from '@/components/PeopleExperiencesSection';
import { ui } from '@/components/PastportUI';
import { station } from '@/data/pastport';

export default function PeopleExperiencesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="people-experiences-back" onPress={() => router.back()} style={styles.back}>
          <Feather name="x" size={18} color={ui.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ILIFA · HUMAN MEMORY</Text>
          <Text style={styles.title}>People’s Experiences</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <PeopleExperiencesSection
          siteId={station.id}
          siteName={station.name}
          coordinates={station.coordinates}
          radius={2000}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  top: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#221F39',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
  },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: ui.foreground, fontSize: 20, fontWeight: '700', marginTop: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 48 },
});
