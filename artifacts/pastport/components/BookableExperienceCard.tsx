import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookingDetailSheet } from '@/components/BookingDetailSheet';
import type { BookableExperience } from '@/data/bookableExperiences';
import { PrimaryButton, ui } from '@/components/PastportUI';

type BookableExperienceCardProps = {
  experience: BookableExperience;
  compact?: boolean;
};

export function BookableExperienceCard({ experience, compact = false }: BookableExperienceCardProps) {
  const [open, setOpen] = useState(false);
  const [booked, setBooked] = useState(false);

  return (
    <>
      <Pressable
        testID={`bookable-experience-${experience.id}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
      >
        <Image source={experience.image} style={[styles.image, compact && styles.imageCompact]} />
        <View style={styles.body}>
          <View style={styles.top}>
            <Text style={styles.tag}>{experience.featuredPartner ? 'FEATURED PARTNER' : experience.category.toUpperCase()}</Text>
            <View style={styles.rating}>
              <Feather name="star" size={12} color={ui.accent} />
              <Text style={styles.ratingText}>{experience.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.name}>{experience.name}</Text>
          <Text style={styles.meta}>
            {experience.duration} · {experience.priceLabel}
          </Text>
          <Text style={styles.tagline}>{experience.tagline}</Text>
          <PrimaryButton
            label={booked ? 'View booking' : 'Book now'}
            icon={booked ? 'check' : 'arrow-up-right'}
            onPress={() => setOpen(true)}
            testID={`book-experience-${experience.id}`}
          />
        </View>
      </Pressable>

      {open ? (
        <BookingDetailSheet
          experience={experience}
          onClose={() => setOpen(false)}
          onConfirmed={() => setBooked(true)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: ui.card,
    marginBottom: 13,
  },
  compact: { marginBottom: 12 },
  image: { width: '100%', height: 156 },
  imageCompact: { height: 132 },
  body: { padding: 16, gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { color: ui.accent, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: ui.foreground, fontSize: 12, fontWeight: '700' },
  name: { color: ui.foreground, fontSize: 17, fontWeight: '700' },
  meta: { color: ui.foreground, fontSize: 13, fontWeight: '600' },
  tagline: { color: ui.mutedForeground, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  pressed: { opacity: 0.9 },
});
