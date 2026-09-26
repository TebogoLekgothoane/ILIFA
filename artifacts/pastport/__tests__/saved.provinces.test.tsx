import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SavedScreen from '@/app/(tabs)/saved';
import ExploreMap from '@/components/ExploreMap';
import { mockPhotographs, mockSavedSiteIds, mockVisitedSiteIds, station } from '@/data/pastport';

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

const mockToggleSaved = jest.fn();

jest.mock('@/context/PastportContext', () => ({
  usePastport: () => ({
    savedSites: mockSavedSiteIds,
    visitedSites: mockVisitedSiteIds,
    toggleSaved: mockToggleSaved,
  }),
}));

jest.mock('@/components/PastportUI', () => {
  const React = require('react');
  const { Pressable, View, Text } = require('react-native');

  return {
    Pill: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, null, label)),
    ScreenShell: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    SectionHeading: ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        action
          ? React.createElement(Pressable, { onPress: onAction }, React.createElement(Text, null, action))
          : null,
      ),
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
  beforeEach(() => {
    mockToggleSaved.mockClear();
  });

  it('shows visited places on the selected province map', () => {
    const screen = render(<SavedScreen />);

    expect(mockedMap.latest?.label).toBe('EASTERN CAPE');
    expect(mockedMap.latest?.markers?.map((marker) => marker.title)).toEqual([
      station.name,
      'Fort Glamorgan',
    ]);
    expect(screen.getAllByText(station.name).length).toBeGreaterThan(0);
    expect(screen.getByText('Eastern Cape · 2')).toBeTruthy();
    expect(screen.getByText('Western Cape · 1')).toBeTruthy();
    expect(screen.getByText('Gauteng · 1')).toBeTruthy();
    expect(screen.getByText('KwaZulu-Natal · 1')).toBeTruthy();

    fireEvent.press(screen.getByText('Gauteng · 1'));

    expect(mockedMap.latest?.label).toBe('GAUTENG');
    expect(mockedMap.latest?.markers?.map((marker) => marker.title)).toEqual(['Union Buildings']);
    expect(screen.getByText('Union Buildings')).toBeTruthy();
  });

  it('lists saved experiences and photographs from mock data', () => {
    const screen = render(<SavedScreen />);

    expect(screen.getByText('Robben Island')).toBeTruthy();
    expect(screen.getByText('Constitution Hill')).toBeTruthy();
    expect(screen.getByText(mockPhotographs[0].title)).toBeTruthy();
    expect(screen.getByText(mockPhotographs[1].title)).toBeTruthy();
    expect(screen.getByText(mockPhotographs[2].title)).toBeTruthy();
  });

  it('lets the user remove a saved experience in edit mode', () => {
    const screen = render(<SavedScreen />);

    fireEvent.press(screen.getByText('Edit'));
    fireEvent.press(screen.getByLabelText('Remove Robben Island'));

    expect(mockToggleSaved).toHaveBeenCalledWith('robben-island');
  });
});
