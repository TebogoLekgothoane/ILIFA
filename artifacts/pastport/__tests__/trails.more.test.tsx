import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import TrailsScreen from '@/app/(tabs)/trails';
import { openTrailPlaces } from '@/lib/directions';
import { moreTrails } from '@/data/pastport';

jest.mock('@/lib/directions', () => ({
  openTrailPlaces: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    HeroImage: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    PrimaryButton: ({ label, onPress }: { label: string; onPress?: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, null, label)),
    ScreenShell: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
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

describe('TrailsScreen more ways to explore', () => {
  it('opens hardcoded map places for secondary trails', () => {
    const screen = render(<TrailsScreen />);

    fireEvent.press(screen.getByTestId('trail-mini-Rail & Industry'));

    expect(openTrailPlaces).toHaveBeenCalledWith(moreTrails[0].mapPlaces);
  });
});
