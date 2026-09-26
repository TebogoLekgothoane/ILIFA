import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import TrailDetailScreen from '@/app/trail';
import { heritageTrailMapPlaces } from '@/data/pastport';
import { openTrailPlaces } from '@/lib/directions';

jest.mock('@/lib/directions', () => ({
  mapsAppName: (os = require('react-native').Platform.OS) => (os === 'ios' ? 'Maps' : 'Google Maps'),
  openTrailPlaces: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

describe('TrailDetailScreen', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('opens Apple Maps from the iOS start-trail button with hardcoded places', () => {
    Platform.OS = 'ios';
    const screen = render(<TrailDetailScreen />);

    fireEvent.press(screen.getByText('Start trail in Maps'));

    expect(openTrailPlaces).toHaveBeenCalledWith(heritageTrailMapPlaces);
    expect(screen.getByText('Continue trail in Maps')).toBeTruthy();
  });

  it('opens Google Maps from the Android start-trail button with hardcoded places', () => {
    Platform.OS = 'android';
    const screen = render(<TrailDetailScreen />);

    fireEvent.press(screen.getByText('Start trail in Google Maps'));

    expect(openTrailPlaces).toHaveBeenCalledWith(heritageTrailMapPlaces);
    expect(screen.getByText('Continue trail in Google Maps')).toBeTruthy();
  });
});
