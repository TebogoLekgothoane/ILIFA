import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ExploreScreen from '@/app/(tabs)/explore';
import { openDirections } from '@/lib/directions';

jest.mock('@/lib/directions', () => ({
  openDirections: jest.fn(),
}));

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
  const { Pressable } = require('react-native');
  return {
    __esModule: true,
    default: ({ onNavigate }: { onNavigate?: () => void }) =>
      React.createElement(Pressable, { testID: 'map-navigate-control', onPress: onNavigate }),
  };
});

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    IconButton: () => null,
    Pill: () => null,
    ScreenShell: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    SectionHeading: () => null,
    TopBar: () => null,
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

describe('ExploreScreen navigation', () => {
  it('opens directions to the station from the map navigation control', () => {
    const screen = render(<ExploreScreen />);

    fireEvent.press(screen.getByTestId('map-navigate-control'));

    expect(openDirections).toHaveBeenCalledWith(
      { latitude: -33.0153, longitude: 27.9116 },
      'East London Railway Station',
    );
  });
});
