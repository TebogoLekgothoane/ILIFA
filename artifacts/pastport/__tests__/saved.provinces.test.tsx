import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SavedScreen from '@/app/(tabs)/saved';
import ExploreMap from '@/components/ExploreMap';
import { station } from '@/data/pastport';

type CapturedMap = {
  label?: string;
  latitudeDelta?: number;
  markers?: { title: string }[];
};

jest.mock('@/components/ExploreMap', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = (props: CapturedMap) => {
    MockMap.latest = props;
    return React.createElement(View, { testID: 'saved-map' });
  };
  MockMap.latest = null as CapturedMap | null;
  return { __esModule: true, default: MockMap };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/context/PastportContext', () => ({
  usePastport: () => ({
    savedSites: [],
    visitedSites: ['east-london-station'],
  }),
}));

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { Pressable, View, Text } = require('react-native');

  return {
    Pill: ({ label, onPress }: { label: string; onPress: () => void }) =>
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

const mockedMap = ExploreMap as typeof ExploreMap & { latest: CapturedMap | null };

describe('SavedScreen province maps', () => {
  it('shows visited places on the selected province map', () => {
    const screen = render(<SavedScreen />);

    expect(mockedMap.latest?.label).toBe('EASTERN CAPE');
    expect(mockedMap.latest?.markers?.map((marker) => marker.title)).toEqual([station.name]);
    expect(mockedMap.latest?.latitudeDelta).toBe(0.08);
    expect(screen.getByText(`${station.name}`)).toBeTruthy();
    expect(screen.getByText('Eastern Cape · 1')).toBeTruthy();

    fireEvent.press(screen.getByText('Gauteng'));

    expect(mockedMap.latest?.label).toBe('GAUTENG');
    expect(mockedMap.latest?.markers).toEqual([]);
    expect(screen.getByText('Visit a place in Gauteng and it will show up here.')).toBeTruthy();
  });
});
