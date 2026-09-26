import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BookableExperience } from '@/data/bookableExperiences';
import { PrimaryButton, ui } from '@/components/PastportUI';

type PickerMode = 'date' | 'time';

type BookingDetailSheetProps = {
  experience: BookableExperience;
  onClose: () => void;
  onConfirmed?: (details: BookingRequest) => void;
};

export type BookingRequest = {
  experienceId: string;
  dateLabel: string;
  timeLabel: string;
  guests: number;
  name: string;
  contact: string;
  notes: string;
  totalLabel: string;
};

function defaultSchedule(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(11, 30, 0, 0);
  return next;
}

export function BookingDetailSheet({ experience, onClose, onConfirmed }: BookingDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const dateLabel = formatDateLabel(scheduledAt);
  const timeLabel = formatTimeLabel(scheduledAt);
  const totalZar = experience.priceZar * guests;
  const totalLabel = formatZar(totalZar);
  const canConfirm = name.trim().length > 0 && contact.trim().length > 0;
  const minimumDate = useMemo(() => {
    const soonest = new Date();
    soonest.setHours(0, 0, 0, 0);
    return soonest;
  }, []);

  const summary = useMemo(
    () => `${dateLabel} · ${timeLabel} · ${guests} ${guests === 1 ? 'guest' : 'guests'}`,
    [dateLabel, guests, timeLabel],
  );

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;

    setScheduledAt((current) => {
      const next = new Date(current);
      if (pickerMode === 'date') {
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return next;
    });
  }

  function confirm() {
    if (!canConfirm) return;
    const details: BookingRequest = {
      experienceId: experience.id,
      dateLabel,
      timeLabel,
      guests,
      name: name.trim(),
      contact: contact.trim(),
      notes: notes.trim(),
      totalLabel,
    };
    setConfirmed(true);
    onConfirmed?.(details);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose} testID="booking-detail-sheet">
      <View style={styles.overlay}>
        <Pressable testID="booking-detail-backdrop" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{experience.featuredPartner ? 'FEATURED PARTNER' : 'BOOKABLE EXPERIENCE'}</Text>
              <Text style={styles.title}>{experience.name}</Text>
            </View>
            <Pressable testID="booking-detail-close" onPress={onClose} style={styles.close}>
              <Feather name="x" size={18} color={ui.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Image source={experience.image} style={styles.hero} />

            <View style={styles.metaRow}>
              <View style={styles.rating}>
                <Feather name="star" size={13} color={ui.accent} />
                <Text style={styles.ratingText}>
                  {experience.rating.toFixed(1)} · {experience.reviewCount} reviews
                </Text>
              </View>
              <Text style={styles.price}>{experience.priceLabel} / person</Text>
            </View>

            <Text style={styles.tagline}>{experience.tagline}</Text>
            <Text style={styles.description}>{experience.description}</Text>

            <Text style={styles.sectionLabel}>Hosted by</Text>
            <View style={styles.host}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostInitials}>{experience.hostName.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>{experience.hostName}</Text>
                <Text style={styles.hostRole}>{experience.hostRole}</Text>
              </View>
            </View>

            <View style={styles.listsRow}>
              <View style={styles.listColumn}>
                <Text style={styles.columnLabel}>What’s included</Text>
                {experience.includes.map((item) => (
                  <View key={item} style={styles.listRow}>
                    <Feather name="check" size={12} color={ui.primary} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.listColumn}>
                <Text style={styles.columnLabel}>Highlights</Text>
                {experience.highlights.map((item) => (
                  <View key={item} style={styles.listRow}>
                    <Feather name="circle" size={7} color={ui.accent} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            {confirmed ? (
              <View style={styles.confirmed} testID="booking-confirmed">
                <Feather name="check-circle" size={22} color="#78D6A2" />
                <Text style={styles.confirmedTitle}>Booking requested</Text>
                <Text style={styles.confirmedCopy}>
                  {summary}. {experience.hostName} will confirm your place. Total {totalLabel}.
                </Text>
                <PrimaryButton label="Done" icon="check" onPress={onClose} testID="booking-done" />
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Date & time</Text>
                <View style={styles.scheduleRow}>
                  <Pressable
                    testID="booking-date-picker"
                    onPress={() => setPickerMode('date')}
                    style={[styles.scheduleButton, pickerMode === 'date' && styles.scheduleButtonActive]}
                  >
                    <Feather name="calendar" size={14} color={ui.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleLabel}>Date</Text>
                      <Text style={styles.scheduleValue}>{dateLabel}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    testID="booking-time-picker"
                    onPress={() => setPickerMode('time')}
                    style={[styles.scheduleButton, pickerMode === 'time' && styles.scheduleButtonActive]}
                  >
                    <Feather name="clock" size={14} color={ui.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleLabel}>Time</Text>
                      <Text style={styles.scheduleValue}>{timeLabel}</Text>
                    </View>
                  </Pressable>
                </View>

                {pickerMode ? (
                  <View style={styles.pickerWrap} testID={`booking-${pickerMode}-control`}>
                    <DateTimePicker
                      value={scheduledAt}
                      mode={pickerMode}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onPickerChange}
                      minimumDate={pickerMode === 'date' ? minimumDate : undefined}
                      minuteInterval={15}
                      themeVariant="dark"
                      accentColor={ui.primary}
                    />
                    {Platform.OS === 'ios' ? (
                      <Pressable testID="booking-picker-done" onPress={() => setPickerMode(null)} style={styles.pickerDone}>
                        <Text style={styles.pickerDoneText}>Done</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <Text style={styles.sectionLabel}>Guests</Text>
                <View style={styles.guests}>
                  <Pressable
                    testID="booking-guests-minus"
                    onPress={() => setGuests((current) => Math.max(1, current - 1))}
                    style={styles.guestButton}
                  >
                    <Feather name="minus" size={16} color={ui.foreground} />
                  </Pressable>
                  <Text style={styles.guestCount}>{guests}</Text>
                  <Pressable
                    testID="booking-guests-plus"
                    onPress={() => setGuests((current) => Math.min(experience.maxGuests, current + 1))}
                    style={styles.guestButton}
                  >
                    <Feather name="plus" size={16} color={ui.foreground} />
                  </Pressable>
                  <Text style={styles.guestHint}>Max {experience.maxGuests}</Text>
                </View>

                <Text style={styles.sectionLabel}>Your details</Text>

                <TextInput
                  testID="booking-notes"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes for the host (optional)"
                  placeholderTextColor={ui.mutedForeground}
                  style={[styles.input, styles.notes]}
                  multiline
                />

                <Text style={styles.cancellation}>{experience.cancellation}</Text>

                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalMeta}>{summary}</Text>
                  </View>
                  <Text style={styles.totalValue}>{totalLabel}</Text>
                </View>

                <PrimaryButton
                  label={`Request booking · ${totalLabel}`}
                  icon="arrow-up-right"
                  onPress={confirm}
                  testID="booking-confirm"
                />
                {!canConfirm ? (
                  <Text style={styles.hint}>Add your name and contact to request this booking.</Text>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function formatZar(amount: number): string {
  return `R${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDateLabel(value: Date): string {
  return value.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(value: Date): string {
  return value.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,3,12,0.62)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#141225',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#5B4A86',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#6B5A96', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  eyebrow: { color: ui.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: ui.foreground, fontSize: 22, fontWeight: '700', marginTop: 4 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2A2345',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingBottom: 16 },
  hero: { width: '100%', height: 168, borderRadius: 18, backgroundColor: '#2A2345' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { color: ui.foreground, fontSize: 12, fontWeight: '700' },
  price: { color: ui.accent, fontSize: 13, fontWeight: '700' },
  tagline: { color: ui.foreground, fontSize: 15, fontWeight: '700', marginTop: 12 },
  description: { color: '#D2CDDC', fontSize: 13, lineHeight: 20, marginTop: 8 },
  sectionLabel: { color: '#C9C3D6', fontSize: 11, fontWeight: '700', marginTop: 18, marginBottom: 10 },
  host: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ui.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: { color: '#100D1B', fontSize: 16, fontWeight: '800' },
  hostName: { color: ui.foreground, fontSize: 14, fontWeight: '700' },
  hostRole: { color: ui.mutedForeground, fontSize: 11, marginTop: 3 },
  listsRow: { flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'flex-start' },
  listColumn: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  columnLabel: { color: '#C9C3D6', fontSize: 10, fontWeight: '700', marginBottom: 8 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  listText: { color: '#D2CDDC', fontSize: 11, lineHeight: 15, flex: 1 },
  scheduleRow: { flexDirection: 'row', gap: 8 },
  scheduleButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#1B1832',
    borderWidth: 1,
    borderColor: '#3E3762',
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleButtonActive: { borderColor: ui.primary, backgroundColor: 'rgba(185,156,255,0.12)' },
  scheduleLabel: { color: ui.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  scheduleValue: { color: ui.foreground, fontSize: 12, fontWeight: '700', marginTop: 3 },
  pickerWrap: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1B1832',
    borderWidth: 1,
    borderColor: '#3E3762',
    overflow: 'hidden',
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: ui.primary,
  },
  pickerDoneText: { color: '#0B0A13', fontSize: 12, fontWeight: '700' },
  guests: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#241F40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#68549A',
  },
  guestCount: { color: ui.foreground, fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  guestHint: { color: ui.mutedForeground, fontSize: 11, marginLeft: 4 },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3E3762',
    backgroundColor: '#1B1832',
    color: ui.foreground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  cancellation: { color: ui.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#3E3762',
  },
  totalLabel: { color: ui.foreground, fontSize: 15, fontWeight: '700' },
  totalMeta: { color: ui.mutedForeground, fontSize: 11, marginTop: 4 },
  totalValue: { color: ui.accent, fontSize: 22, fontWeight: '700' },
  hint: { color: ui.mutedForeground, fontSize: 11, marginTop: 10, textAlign: 'center' },
  confirmed: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#1A2430',
    borderWidth: 1,
    borderColor: '#3D6B55',
    gap: 10,
    alignItems: 'flex-start',
  },
  confirmedTitle: { color: ui.foreground, fontSize: 18, fontWeight: '700' },
  confirmedCopy: { color: '#D2CDDC', fontSize: 13, lineHeight: 19, marginBottom: 6 },
});
