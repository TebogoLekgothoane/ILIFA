import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { station } from '@/data/pastport';
import { PrimaryButton, ui } from '@/components/PastportUI';

const slides = [
  { eyebrow: 'WELCOME TO PASTPORT', title: 'Places remember.\nStories live again.', copy: 'A new way to experience the places that shaped us.', image: station.hero },
  { eyebrow: 'WHAT BRINGS HISTORY TO LIFE?', title: 'See the past.\nHear the story.', copy: 'Walk through immersive reconstructions, listen to contextual narration, and explore at your own pace.', image: station.reconstruction },
  { eyebrow: 'MAKE IT YOURS', title: 'Choose your\nlanguage.', copy: 'Narration and guidance are available in the language that feels most like home.', image: station.hero },
];

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const current = slides[slide];
  return <View style={styles.screen}><ImageBackground source={current.image} style={styles.image}><LinearGradient colors={['rgba(7,7,17,0.1)', 'rgba(7,7,17,0.96)']} style={StyleSheet.absoluteFill} /><View style={styles.top}><Text style={styles.brand}>PASTPORT</Text><Pressable onPress={() => router.replace('/')}><Text style={styles.skip}>Skip</Text></Pressable></View><View style={styles.content}><Text style={styles.eyebrow}>{current.eyebrow}</Text><Text style={styles.title}>{current.title}</Text><Text style={styles.copy}>{current.copy}</Text>{slide === 2 ? <View style={styles.languages}><Language label="English" active /><Language label="isiXhosa" /><Language label="isiZulu" /><Language label="Afrikaans" /></View> : <View style={styles.benefits}><Benefit icon="maximize" title="SEE THE PAST" copy="Experience historical locations through immersive AR." /><Benefit icon="volume-2" title="HEAR THE STORY" copy="Listen to contextual historical narration." /><Benefit icon="map" title="EXPLORE YOUR WAY" copy="Follow self-guided heritage trails." /></View>}<PrimaryButton label={slide === 2 ? 'Continue' : slide === 0 ? 'Start exploring' : 'Continue'} icon="arrow-right" onPress={() => slide === 2 ? router.replace('/') : setSlide((value) => value + 1)} /></View></ImageBackground><View style={styles.dots}>{slides.map((_, index) => <View key={index} style={[styles.dot, index === slide && styles.dotActive]} />)}</View></View>;
}

function Benefit({ icon, title, copy }: { icon: keyof typeof Feather.glyphMap; title: string; copy: string }) { return <View style={styles.benefit}><View style={styles.benefitIcon}><Feather name={icon} size={15} color={ui.accent} /></View><View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitCopy}>{copy}</Text></View></View>; }
function Language({ label, active }: { label: string; active?: boolean }) { return <Pressable style={[styles.language, active && styles.languageActive]}><Text style={[styles.languageText, active && styles.languageTextActive]}>{label}</Text>{active ? <Feather name="check" size={16} color={ui.primary} /> : null}</Pressable>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  image: { flex: 1, justifyContent: 'space-between' },
  top: { paddingTop: 61, paddingHorizontal: 23, flexDirection: 'row', justifyContent: 'space-between' },
  brand: { color: ui.foreground, fontSize: 14, letterSpacing: 3.5, fontWeight: '700' },
  skip: { color: '#D2CDD9', fontSize: 13 },
  content: { paddingHorizontal: 23, paddingBottom: 36 },
  eyebrow: { color: '#F0C186', fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 13 },
  title: { color: ui.foreground, fontSize: 38, lineHeight: 41, fontWeight: '700', letterSpacing: -1 },
  copy: { color: '#D1CBD9', fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  benefits: { gap: 13, marginBottom: 25 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: 'rgba(35,29,63,0.9)', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { color: ui.foreground, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  benefitCopy: { color: '#A9A3B6', fontSize: 11, marginTop: 3 },
  languages: { gap: 8, marginBottom: 22 },
  language: { minHeight: 44, paddingHorizontal: 15, borderRadius: 15, backgroundColor: 'rgba(29,26,49,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageActive: { borderColor: ui.primary, backgroundColor: 'rgba(91,67,150,0.7)' },
  languageText: { color: '#D2CDDA', fontSize: 13, fontWeight: '600' },
  languageTextActive: { color: ui.foreground },
  dots: { position: 'absolute', bottom: 19, alignSelf: 'center', flexDirection: 'row', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#656078' },
  dotActive: { width: 21, backgroundColor: ui.primary },
});