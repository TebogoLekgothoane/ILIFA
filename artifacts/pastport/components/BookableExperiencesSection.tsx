import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookableExperienceCard } from '@/components/BookableExperienceCard';
import { bookableExperiences } from '@/data/bookableExperiences';
import { ui } from '@/components/PastportUI';

type BookableExperiencesSectionProps = {
  limit?: number;
  title?: string;
  subtitle?: string;
};

export function BookableExperiencesSection({
  limit,
  title = 'Experiences near you',
  subtitle = 'What you can do around here — bookable local partners.',
}: BookableExperiencesSectionProps) {
  const items = typeof limit === 'number' ? bookableExperiences.slice(0, limit) : bookableExperiences;

  return (
    <View testID="bookable-experiences-section" style={styles.wrap}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subheading}>{subtitle}</Text>
      {items.map((experience) => (
        <BookableExperienceCard key={experience.id} experience={experience} compact={Boolean(limit)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  heading: { color: ui.foreground, fontSize: 19, fontWeight: '700', marginBottom: 6 },
  subheading: { color: ui.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 14 },
});
