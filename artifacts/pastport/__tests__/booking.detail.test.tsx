import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BookableExperienceCard } from '@/components/BookableExperienceCard';
import { bookableExperiences } from '@/data/bookableExperiences';

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ onChange, mode }: { onChange?: (event: { type: string }, date?: Date) => void; mode?: string }) =>
      React.createElement(
        Pressable,
        {
          testID: `mock-datetime-${mode}`,
          onPress: () => onChange?.({ type: 'set' }, new Date('2026-10-03T14:00:00')),
        },
        React.createElement(Text, null, `picker-${mode}`),
      ),
  };
});

describe('BookingDetailSheet', () => {
  it('opens a detailed booking modal from Book now', () => {
    const experience = bookableExperiences[0];
    const screen = render(<BookableExperienceCard experience={experience} />);

    fireEvent.press(screen.getByTestId('book-experience-heritage-walking-tour'));

    expect(screen.getByTestId('booking-detail-sheet')).toBeTruthy();
    expect(screen.getAllByText('East London Heritage Walking Tour').length).toBeGreaterThan(0);
    expect(screen.getByText(/Walk from East London Railway Station/)).toBeTruthy();
    expect(screen.getByText('Thabo & Co. Heritage Walks')).toBeTruthy();
    expect(screen.getByText('What’s included')).toBeTruthy();
    expect(screen.getByText('Licensed local guide')).toBeTruthy();
    expect(screen.getByText('R1,000')).toBeTruthy();
    expect(screen.getByTestId('booking-date-picker')).toBeTruthy();
    expect(screen.getByTestId('booking-time-picker')).toBeTruthy();
  });

  it('lets the visitor pick a date and time with the datetime picker', () => {
    const experience = bookableExperiences[0];
    const screen = render(<BookableExperienceCard experience={experience} />);

    fireEvent.press(screen.getByTestId('book-experience-heritage-walking-tour'));
    fireEvent.press(screen.getByTestId('booking-date-picker'));
    expect(screen.getByTestId('booking-date-control')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mock-datetime-date'));
    fireEvent.press(screen.getByTestId('booking-time-picker'));
    fireEvent.press(screen.getByTestId('mock-datetime-time'));
    expect(screen.getByText('14:00')).toBeTruthy();
  });

  it('requests a booking with guest details', () => {
    const experience = bookableExperiences[0];
    const screen = render(<BookableExperienceCard experience={experience} />);

    fireEvent.press(screen.getByTestId('book-experience-heritage-walking-tour'));
    fireEvent.press(screen.getByTestId('booking-guests-plus'));
    fireEvent.changeText(screen.getByTestId('booking-name'), 'Anele Moyo');
    fireEvent.changeText(screen.getByTestId('booking-contact'), 'anele@example.com');
    fireEvent.press(screen.getByTestId('booking-confirm'));

    expect(screen.getByTestId('booking-confirmed')).toBeTruthy();
    expect(screen.getByText('Booking requested')).toBeTruthy();
    expect(screen.getByText(/R1,500/)).toBeTruthy();
  });
});
