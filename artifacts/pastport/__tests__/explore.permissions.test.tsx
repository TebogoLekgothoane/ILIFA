import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ExploreScreen from '@/app/(tabs)/explore';

const mockRequestPermission = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
let mockPermission: { granted: boolean; canAskAgain?: boolean } | null = null;

jest.mock('expo-location', () => ({
  __esModule: true,
  Accuracy: { Balanced: 'balanced' },
  useForegroundPermissions: () => [mockPermission, mockRequestPermission],
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/components/ExploreMap', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/PeopleExperiencesSection', () => ({
  PeopleExperiencesSection: () => null,
}));

jest.mock('@/components/BookableExperiencesSection', () => ({
  BookableExperiencesSection: () => null,
}));

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { Pressable, View, Text } = require('react-native');

  return {
    IconButton: () => null,
    Pill: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, null, label)),
    ScreenShell: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SectionHeading: ({ title }: { title: string }) => React.createElement(Text, null, title),
    TopBar: ({ title }: { title: string }) => React.createElement(Text, null, title),
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
  },
  trail: {
    image: 0,
    name: 'East London Heritage Trail',
    distance: '6.8 km',
    stops: 8,
  },
}));

describe('ExploreScreen location permissions', () => {
  beforeEach(() => {
    mockPermission = { granted: false, canAskAgain: true };
    mockRequestPermission.mockReset();
    mockGetCurrentPositionAsync.mockReset();
    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -33.0153, longitude: 27.9116 },
    });
  });

  it('does not read the location when GPS permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: true });
    const screen = render(<ExploreScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText('Enable GPS'));
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
    expect(screen.getByText('Use your live location to find nearby stories')).toBeTruthy();
  });

  it('gets the current position after GPS permission is granted', async () => {
    mockRequestPermission.mockImplementation(async () => {
      mockPermission = { granted: true, canAskAgain: true };
      return mockPermission;
    });
    const screen = render(<ExploreScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText('Enable GPS'));
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 'balanced' });
    expect(screen.getByText('Showing your live location')).toBeTruthy();
    expect(screen.getByText('Refresh')).toBeTruthy();
  });
});