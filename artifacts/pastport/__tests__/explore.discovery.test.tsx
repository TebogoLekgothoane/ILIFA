import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ExploreScreen from '@/app/(tabs)/explore';

jest.mock('expo-location', () => ({
  __esModule: true,
  Accuracy: { Balanced: 'balanced' },
  useForegroundPermissions: () => [{ granted: false }, jest.fn()],
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/components/ExploreMap', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'explore-map' }),
  };
});

jest.mock('@/components/PeopleExperiencesSection', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    PeopleExperiencesSection: ({ areaAware, radius }: { areaAware?: boolean; radius?: number }) =>
      React.createElement(
        View,
        { testID: 'people-experiences-section' },
        React.createElement(Text, null, areaAware ? "People's Experiences Around You" : 'People Who Experienced This Place'),
        React.createElement(Text, null, `radius:${radius ?? 'default'}`),
      ),
  };
});

jest.mock('@/components/BookableExperiencesSection', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    BookableExperiencesSection: ({ title }: { title?: string }) =>
      React.createElement(
        View,
        { testID: 'bookable-experiences-section' },
        React.createElement(Text, null, title ?? 'Experiences near you'),
      ),
  };
});

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    IconButton: () => null,
    Pill: ({ label, onPress, active }: { label: string; onPress?: () => void; active?: boolean }) =>
      React.createElement(
        Pressable,
        { onPress, testID: `category-${label}` },
        React.createElement(Text, null, active ? `${label}*` : label),
      ),
    ScreenShell: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    SectionHeading: ({ title }: { title: string }) => React.createElement(Text, null, title),
    TopBar: ({ title }: { title: string }) => React.createElement(Text, null, title),
    PrimaryButton: ({ label, onPress, testID }: { label: string; onPress?: () => void; testID?: string }) =>
      React.createElement(Pressable, { onPress, testID }, React.createElement(Text, null, label)),
    ui: {
      accent: '#c0a0ff',
      background: '#070711',
      border: '#29264b',
      card: '#17152d',
      foreground: '#ffffff',
      mutedForeground: '#aaa4b7',
      primary: '#c0a0ff',
    },
  };
});

jest.mock('@/data/pastport', () => ({
  station: {
    id: 'east-london-station',
    name: 'East London Railway Station',
    hero: 0,
    description: 'A station with a story.',
    distance: '1.2 km away',
    period: '1880 — present',
    coordinates: { latitude: -33.0153, longitude: 27.9116 },
  },
  trail: {
    image: 0,
    name: 'East London Heritage Trail',
    distance: '6.8 km',
    stops: 8,
  },
}));

describe('ExploreScreen discovery layers', () => {
  it('keeps heritage, people and bookable experiences on one Explore screen', () => {
    const screen = render(<ExploreScreen />);

    expect(screen.getByText('Search places, people, experiences')).toBeTruthy();
    expect(screen.getByTestId('category-Heritage Sites')).toBeTruthy();
    expect(screen.getByTestId('category-Experiences')).toBeTruthy();
    expect(screen.getByTestId('category-People')).toBeTruthy();
    expect(screen.getByTestId('explore-heritage-section')).toBeTruthy();
    expect(screen.getByTestId('explore-people-section')).toBeTruthy();
    expect(screen.getByTestId('explore-experiences-section')).toBeTruthy();
    expect(screen.getByText("People's Experiences Around You")).toBeTruthy();
    expect(screen.getByText('radius:2000')).toBeTruthy();
    expect(screen.getByText('Nearby experiences')).toBeTruthy();
  });

  it('opens the Experiences category as the commercial booking layer', () => {
    const screen = render(<ExploreScreen />);

    fireEvent.press(screen.getByTestId('category-Experiences'));

    expect(screen.getByTestId('explore-experiences-section')).toBeTruthy();
    expect(screen.getByText('Experiences near you')).toBeTruthy();
    expect(screen.queryByTestId('explore-heritage-section')).toBeNull();
    expect(screen.queryByTestId('explore-people-section')).toBeNull();
  });

  it('opens People as an area-aware memory feed', () => {
    const screen = render(<ExploreScreen />);

    fireEvent.press(screen.getByTestId('category-People'));

    expect(screen.getByTestId('explore-people-section')).toBeTruthy();
    expect(screen.getByText("People's Experiences Around You")).toBeTruthy();
    expect(screen.getByText('radius:2000')).toBeTruthy();
    expect(screen.queryByTestId('explore-experiences-section')).toBeNull();
  });
});
