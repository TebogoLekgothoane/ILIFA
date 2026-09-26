import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ExploreMap from '@/components/ExploreMap';
import { PeopleExperienceCard } from '@/components/PeopleExperienceCard';
import { PeopleExperienceSheet } from '@/components/PeopleExperienceSheet';
import { ShareExperiencePrompt, type ShareExperienceMode } from '@/components/ShareExperiencePrompt';
import { ShareExperienceSheet } from '@/components/ShareExperienceSheet';
import { Pill, ui } from '@/components/PastportUI';
import { usePastport } from '@/context/PastportContext';
import type { PeopleExperience } from '@/data/peoplesExperiences';
import type { MapCoordinate } from '@/data/pastport';
import {
  DEFAULT_EXPERIENCE_RADIUS_METERS,
  experienceStats,
  experiencesForPlace,
  filterExperiencesByKind,
  type ExperienceFeedFilter,
} from '@/lib/peoplesExperiences';

type PeopleExperiencesSectionProps = {
  siteId: string;
  siteName: string;
  coordinates: MapCoordinate;
  /** Neighbourhood radius in metres. Defaults to 3 km. */
  radius?: number;
  /** When true, copy speaks to the area around you — not only one building. */
  areaAware?: boolean;
  showExploringLabel?: boolean;
  showSharePrompt?: boolean;
  showMap?: boolean;
  showFilters?: boolean;
  limit?: number;
};

const filters: { id: ExperienceFeedFilter; label: string }[] = [
  { id: 'all', label: 'All voices' },
  { id: 'community', label: 'Community' },
  { id: 'visitor', label: 'Visitors' },
  { id: 'interview', label: 'Interviews' },
];

export function PeopleExperiencesSection({
  siteId,
  siteName,
  coordinates,
  radius = DEFAULT_EXPERIENCE_RADIUS_METERS,
  areaAware = false,
  showExploringLabel = true,
  showSharePrompt = true,
  showMap = true,
  showFilters = true,
  limit,
}: PeopleExperiencesSectionProps) {
  const { sharedExperiences, addSharedExperience } = usePastport();
  const [kind, setKind] = useState<ExperienceFeedFilter>('all');
  const [selected, setSelected] = useState<PeopleExperience | null>(null);
  const [shareMode, setShareMode] = useState<ShareExperienceMode | null>(null);

  const nearby = useMemo(
    () => experiencesForPlace({ siteId, origin: coordinates, extras: sharedExperiences, radiusMeters: radius }),
    [coordinates, radius, sharedExperiences, siteId],
  );
  const filtered = filterExperiencesByKind(nearby, kind);
  const visible = typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
  const stats = experienceStats(nearby);
  const heading = areaAware ? "People's Experiences Around You" : 'People Who Experienced This Place';
  const subheading = areaAware
    ? 'See what people remember, felt and discovered in this area.'
    : 'See what other people remember, felt and discovered here.';

  return (
    <View testID="people-experiences-section">
      {showExploringLabel && !areaAware ? (
        <Text style={styles.exploring}>You are exploring {siteName}</Text>
      ) : null}
      {showExploringLabel && areaAware ? (
        <Text style={styles.exploring}>Near {siteName} · within {(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)} km</Text>
      ) : null}
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subheading}>{subheading}</Text>

      {showFilters ? (
        <View style={styles.filters}>
          {filters.map((item) => (
            <Pill key={item.id} label={item.label} active={kind === item.id} onPress={() => setKind(item.id)} />
          ))}
        </View>
      ) : null}

      {showMap ? (
        <>
          <Text style={styles.mapLabel}>{areaAware ? 'Recorded around you' : 'Recorded around this place'}</Text>
          <ExploreMap
            coordinates={coordinates}
            latitudeDelta={0.028}
            longitudeDelta={0.028}
            label={areaAware ? 'AROUND YOU' : 'AROUND THIS PLACE'}
            style={styles.map}
            markers={nearby.map((experience) => ({
              title: experience.displayName,
              description: experience.title ?? experience.quote,
              coordinate: experience.coordinates,
              featured: Boolean(experience.storykeeper),
              onPress: () => setSelected(experience),
            }))}
          />
        </>
      ) : null}

      {visible.map((experience) => (
        <PeopleExperienceCard key={experience.id} experience={experience} onPress={() => setSelected(experience)} />
      ))}

      {showSharePrompt ? (
        <>
          <Text style={styles.distinction}>History tells you what happened here.{'\n'}People tell you what this place means.</Text>
          <ShareExperiencePrompt onShare={setShareMode} />
        </>
      ) : null}

      {selected ? <PeopleExperienceSheet experience={selected} onClose={() => setSelected(null)} /> : null}
      {shareMode ? (
        <ShareExperienceSheet
          mode={shareMode}
          siteId={siteId}
          onClose={() => setShareMode(null)}
          onSubmit={(experience) => {
            addSharedExperience(experience);
            setShareMode(null);
            setSelected(experience);
          }}
        />
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  exploring: { color: ui.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.2, marginBottom: 10 },
  heading: { color: ui.foreground, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  subheading: { color: '#C9C3D6', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  stat: {
    width: '48%',
    backgroundColor: '#17152D',
    borderRadius: 16,
    padding: 12,
  },
  statValue: { color: ui.foreground, fontSize: 22, fontWeight: '700' },
  statLabel: { color: ui.mutedForeground, fontSize: 11, marginTop: 4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  mapLabel: { color: '#A39EB4', fontSize: 9, letterSpacing: 1.3, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  map: { height: 220, marginBottom: 18 },
  distinction: { color: '#D8D3E4', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 8 },
});
