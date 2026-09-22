import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell, SectionHeading, TopBar, ui } from '@/components/PastportUI';
import { badges } from '@/data/pastport';
import { usePastport } from '@/context/PastportContext';

export default function ProfileScreen() {
  const { visitedSites } = usePastport();
  return (
    <ScreenShell>
      <TopBar title="Profile" eyebrow="YOUR HERITAGE STORY" right={<Feather name="settings" size={20} color={ui.accent} />} />
      <View style={styles.profileHeader}><View style={styles.avatar}><Text style={styles.avatarText}>TL</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>Thando Lekgothoa</Text><Text style={styles.member}>Curious since 2026</Text></View><Pressable style={styles.editButton}><Text style={styles.editText}>Edit</Text></Pressable></View>
      <View style={styles.statRow}><Stat value={String(visitedSites.length || 0)} label="Sites visited" /><Stat value="3" label="Periods seen" /><Stat value="120" label="Heritage points" /></View>
      <SectionHeading title="Badges" action="View all" onAction={() => undefined} />
      <View style={styles.badges}>{badges.map((badge) => <View key={badge.title} style={[styles.badge, !badge.earned && styles.badgeMuted]}><View style={[styles.badgeIcon, !badge.earned && styles.badgeIconMuted]}><Feather name={badge.earned ? 'award' : 'lock'} size={17} color={badge.earned ? ui.accent : ui.mutedForeground} /></View><Text style={[styles.badgeTitle, !badge.earned && styles.badgeTextMuted]}>{badge.title}</Text><Text style={styles.badgeDescription}>{badge.description}</Text></View>)}</View>
      <SectionHeading title="Preferences" />
      <PrefRow icon="globe" title="Narration language" value="English" />
      <PrefRow icon="sliders" title="Accessibility" value="Manage" />
      <PrefRow icon="bell" title="Notifications" value="On" />
      <Pressable style={styles.onboardingLink} onPress={() => router.push('/onboarding')}><View style={styles.onboardingIcon}><Feather name="play-circle" size={17} color={ui.primary} /></View><View style={{ flex: 1 }}><Text style={styles.onboardingTitle}>Replay the introduction</Text><Text style={styles.onboardingCopy}>See how PASTPORT works</Text></View><Feather name="chevron-right" size={17} color={ui.mutedForeground} /></Pressable>
    </ScreenShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function PrefRow({ icon, title, value }: { icon: keyof typeof Feather.glyphMap; title: string; value: string }) { return <Pressable style={styles.prefRow}><View style={styles.prefIcon}><Feather name={icon} size={16} color={ui.accent} /></View><Text style={styles.prefTitle}>{title}</Text><Text style={styles.prefValue}>{value}</Text><Feather name="chevron-right" size={15} color={ui.mutedForeground} /></Pressable>; }

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 22 },
  avatar: { width: 60, height: 60, borderRadius: 22, backgroundColor: '#2B2551', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7965BE' },
  avatarText: { color: ui.primary, fontSize: 18, fontWeight: '700' },
  name: { color: ui.foreground, fontSize: 17, fontWeight: '700' },
  member: { color: ui.mutedForeground, fontSize: 12, marginTop: 4 },
  editButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13, backgroundColor: ui.card },
  editText: { color: ui.accent, fontSize: 12, fontWeight: '700' },
  statRow: { flexDirection: 'row', backgroundColor: ui.card, borderRadius: 20, marginBottom: 28 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: ui.border },
  statValue: { color: ui.foreground, fontSize: 20, fontWeight: '700' },
  statLabel: { color: ui.mutedForeground, fontSize: 10, marginTop: 5, textAlign: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 27 },
  badge: { width: '48%', minHeight: 132, padding: 13, borderRadius: 19, backgroundColor: '#1D1A35', borderWidth: 1, borderColor: '#352F55' },
  badgeMuted: { backgroundColor: ui.card, borderColor: ui.border },
  badgeIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: '#302653', alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  badgeIconMuted: { backgroundColor: '#242232' },
  badgeTitle: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  badgeTextMuted: { color: ui.mutedForeground },
  badgeDescription: { color: ui.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 6 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: ui.border },
  prefIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#24203E', alignItems: 'center', justifyContent: 'center' },
  prefTitle: { color: ui.foreground, flex: 1, fontSize: 13, fontWeight: '600' },
  prefValue: { color: ui.mutedForeground, fontSize: 12 },
  onboardingLink: { marginTop: 24, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#181632', borderRadius: 18 },
  onboardingIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#29224D', alignItems: 'center', justifyContent: 'center' },
  onboardingTitle: { color: ui.foreground, fontSize: 13, fontWeight: '700' },
  onboardingCopy: { color: ui.mutedForeground, fontSize: 11, marginTop: 3 },
});