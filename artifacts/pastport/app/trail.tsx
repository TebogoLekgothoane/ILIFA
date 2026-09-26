import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { heritageTrailMapPlaces, trail } from '@/data/pastport';
import { mapsAppName, openTrailPlaces } from '@/lib/directions';
import { PrimaryButton, ui } from '@/components/PastportUI';

export default function TrailDetailScreen() {
  const [started, setStarted] = useState(false);

  async function startTrail() {
    setStarted(true);
    await openTrailPlaces(heritageTrailMapPlaces);
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={trail.image} style={styles.cover}>
        <LinearGradient colors={['rgba(8,8,18,0.25)', 'rgba(8,8,18,0.98)']} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={19} color={ui.foreground} />
        </Pressable>
        <View style={styles.coverText}>
          <Text style={styles.eyebrow}>SELF-GUIDED HERITAGE TRAIL</Text>
          <Text style={styles.title}>{trail.name}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>{trail.duration}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaItem}>{trail.distance}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaItem}>{trail.stops} locations</Text>
          </View>
        </View>
      </ImageBackground>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 45 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{trail.description}</Text>
        <View style={styles.progress}>
          <View>
            <Text style={styles.progressLabel}>{started ? 'TRAIL IN PROGRESS' : 'YOUR PROGRESS'}</Text>
            <Text style={styles.progressTitle}>{started ? '3 / 8 locations discovered' : 'Ready when you are'}</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>{started ? '38%' : '0%'}</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>The route</Text>
        {trail.locations.map((location, index) => (
          <View key={location.name} style={styles.stop}>
            <View style={[styles.stopNumber, location.done && styles.stopDone]}>
              {location.done ? <Feather name="check" size={13} color="#0B0A13" /> : <Text style={styles.numberText}>{index + 1}</Text>}
            </View>
            <View style={styles.stopLine} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stopName}>{location.name}</Text>
              <Text style={styles.stopMeta}>
                {location.time} <Text style={styles.stopPeriod}>· {location.period}</Text>
              </Text>
            </View>
            <Feather name={location.done ? 'check-circle' : 'circle'} size={16} color={location.done ? '#78D6A2' : ui.mutedForeground} />
          </View>
        ))}
        <PrimaryButton
          label={started ? `Continue trail in ${mapsAppName()}` : `Start trail in ${mapsAppName()}`}
          icon="arrow-right"
          onPress={() => {
            void startTrail();
          }}
          testID="start-trail"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  cover: { height: 360, justifyContent: 'flex-end' },
  back: { position: 'absolute', top: 57, left: 18, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(12,11,23,0.65)', alignItems: 'center', justifyContent: 'center' },
  coverText: { padding: 22, paddingBottom: 25 },
  eyebrow: { color: '#E9BB7F', fontSize: 9, letterSpacing: 1.35, fontWeight: '700' },
  title: { color: ui.foreground, fontSize: 31, lineHeight: 35, fontWeight: '700', marginTop: 10 },
  meta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 13 },
  metaItem: { color: '#D3CFDB', fontSize: 12 },
  metaDot: { color: ui.accent },
  body: { paddingHorizontal: 20, marginTop: -1 },
  description: { color: '#C4BFCE', fontSize: 15, lineHeight: 22, marginTop: 20, marginBottom: 20 },
  progress: { padding: 16, backgroundColor: '#181631', borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  progressLabel: { color: ui.accent, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  progressTitle: { color: ui.foreground, fontSize: 14, fontWeight: '700', marginTop: 6 },
  progressCircle: { width: 47, height: 47, borderRadius: 24, borderWidth: 4, borderColor: ui.primary, alignItems: 'center', justifyContent: 'center' },
  progressNumber: { color: ui.foreground, fontSize: 10, fontWeight: '700' },
  sectionTitle: { color: ui.foreground, fontSize: 19, fontWeight: '700', marginBottom: 10 },
  stop: { flexDirection: 'row', alignItems: 'center', minHeight: 63 },
  stopNumber: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#4B4665', backgroundColor: '#25223F', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  stopDone: { backgroundColor: '#78D6A2', borderColor: '#78D6A2' },
  numberText: { color: ui.mutedForeground, fontSize: 11, fontWeight: '700' },
  stopLine: { position: 'absolute', left: 13, top: 41, bottom: -12, width: 1, backgroundColor: '#3A3654' },
  stopName: { color: ui.foreground, fontSize: 14, fontWeight: '700', marginLeft: 13 },
  stopMeta: { color: ui.mutedForeground, fontSize: 11, marginLeft: 13, marginTop: 4 },
  stopPeriod: { color: ui.accent },
});