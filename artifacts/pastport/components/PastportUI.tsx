import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';

const palette = colors.light;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandGlyph}>
        <View style={styles.brandGlyphInner} />
      </View>
      <Text style={[styles.brand, compact && styles.brandCompact]}>PASTPORT</Text>
    </View>
  );
}

export function ScreenShell({
  children,
  scroll = true,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.shellContent, { paddingTop: insets.top + 18 }, contentStyle]}>
      {children}
    </View>
  );
  return scroll ? (
    <ScrollView
      style={[styles.shell, style]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    <View style={[styles.shell, style]}>{content}</View>
  );
}

export function TopBar({
  title,
  eyebrow,
  right,
}: {
  title?: string;
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      <View>
        <BrandMark compact />
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  active = false,
  testID,
}: {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
  active?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, active && styles.iconButtonActive, pressed && styles.pressed]}
    >
      <Feather name={name} size={18} color={active ? palette.accent : palette.foreground} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-up-right',
  secondary = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  secondary?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{label}</Text>
      <Feather
        name={icon}
        size={17}
        color={secondary ? palette.foreground : '#0C0B14'}
      />
    </Pressable>
  );
}

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function GlassCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const card = (
    <BlurView intensity={22} tint="dark" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {card}
    </Pressable>
  ) : (
    card
  );
}

export function HeroImage({
  image,
  children,
  height = 430,
  style,
}: {
  image: any;
  children: React.ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ImageBackground source={image} style={[styles.hero, { height }, style]} imageStyle={styles.heroImage}>
      <LinearGradient
        colors={['transparent', 'rgba(8,8,18,0.18)', palette.background]}
        locations={[0.28, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ImageBackground>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export const ui = palette;

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background },
  shellContent: { paddingHorizontal: 20 },
  topBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandGlyph: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyphInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.primary },
  brand: { color: palette.foreground, fontSize: 14, letterSpacing: 3.5, fontWeight: '700' },
  brandCompact: { fontSize: 12, letterSpacing: 3 },
  eyebrow: { color: palette.accent, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', marginTop: 16 },
  pageTitle: { color: palette.foreground, fontSize: 27, fontWeight: '700', marginTop: 5 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(34,32,57,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconButtonActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: 19,
    borderRadius: 18,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: { backgroundColor: 'rgba(31,29,53,0.92)', borderWidth: 1, borderColor: palette.border },
  primaryButtonText: { color: '#0C0B14', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  secondaryButtonText: { color: palette.foreground },
  glassCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(22,21,38,0.7)',
  },
  hero: { overflow: 'hidden', borderRadius: 28, justifyContent: 'flex-end' },
  heroImage: { borderRadius: 28 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { color: palette.foreground, fontSize: 19, fontWeight: '700' },
  sectionAction: { color: palette.accent, fontSize: 13, fontWeight: '600' },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(32,30,52,0.85)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: 'rgba(185,156,255,0.2)', borderColor: 'rgba(185,156,255,0.52)' },
  pillText: { color: palette.mutedForeground, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: palette.foreground },
  metric: { flex: 1, paddingVertical: 16, paddingHorizontal: 14 },
  metricValue: { color: palette.foreground, fontSize: 22, fontWeight: '700' },
  metricLabel: { color: palette.mutedForeground, fontSize: 11, marginTop: 4 },
  divider: { height: 1, backgroundColor: palette.border },
  pressed: { opacity: 0.75 },
});