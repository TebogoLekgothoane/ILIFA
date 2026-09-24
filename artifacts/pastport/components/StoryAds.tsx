import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ui } from '@/components/PastportUI';

export type StoryAd = {
  id: string;
  title: string;
  line: string;
  detail: string;
  image: ImageSourcePropType;
  speaker: string;
  speakerRole: string;
  videoUrl: string | number;
};

type StoryAdsProps = {
  stories: StoryAd[];
  selectedId: string | null;
  onSelect: (story: StoryAd) => void;
};

export function StoryAds({ stories, selectedId, onSelect }: StoryAdsProps) {
  return (
    <View style={styles.wrap} testID="story-rail">
      <Text style={styles.heading}>STORIES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {stories.map((story) => {
          const active = story.id === selectedId;
          return (
            <Pressable key={story.id} testID={`story-ad-${story.id}`} onPress={() => onSelect(story)} style={[styles.ad, active && styles.adActive]}>
              <ImageBackground source={story.image} style={styles.image} imageStyle={styles.imageRadius}>
                <LinearGradient colors={['rgba(8,7,16,0.05)', 'rgba(8,7,16,0.88)']} style={StyleSheet.absoluteFill} />
                <View style={styles.badge}><Text style={styles.badgeText}>STORY</Text></View>
                <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
                <Text style={styles.line} numberOfLines={1}>{story.line}</Text>
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  heading: { color: '#A39EB4', fontSize: 9, letterSpacing: 1.4, fontWeight: '700', marginBottom: 8 },
  row: { gap: 10, paddingRight: 4 },
  ad: { width: 168, height: 104, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  adActive: { borderColor: ui.primary },
  image: { flex: 1, justifyContent: 'flex-end', padding: 10 },
  imageRadius: { borderRadius: 16 },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(185,156,255,0.92)' },
  badgeText: { color: '#100D1B', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: ui.foreground, fontSize: 13, fontWeight: '700' },
  line: { color: '#E4DEEF', fontSize: 10, marginTop: 2 },
});
