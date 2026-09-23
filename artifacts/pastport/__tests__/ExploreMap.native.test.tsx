import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ExploreMap from '@/components/ExploreMap.native';

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(View, { testID: 'native-map', ...props }, children),
    Marker: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(View, { testID: 'map-marker', ...props }, children),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('@/components/PastportUI', () => ({
  ui: {
    foreground: '#ffffff',
    primary: '#c0a0ff',
  },
}));

describe('ExploreMap native marker contract', () => {
  it('renders the station marker and both nearby markers at their expected offsets', () => {
    const onOpenSite = jest.fn();
    const onLocate = jest.fn();
    const coordinates = { latitude: -33.0153, longitude: 27.9116 };
    const screen = render(
      <ExploreMap coordinates={coordinates} onOpenSite={onOpenSite} onLocate={onLocate} />,
    );

    expect(screen.getByTestId('native-map').props.initialRegion).toEqual({
      ...coordinates,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    });

    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(3);
    expect(markers.map((marker) => marker.props.title)).toEqual([
      'East London Railway Station',
      'Historical Square',
      'Donkin Reserve',
    ]);
    expect(markers.map((marker) => marker.props.coordinate)).toEqual([
      coordinates,
      { latitude: coordinates.latitude + 0.008, longitude: coordinates.longitude + 0.007 },
      { latitude: coordinates.latitude - 0.006, longitude: coordinates.longitude - 0.009 },
    ]);

    fireEvent.press(markers[0]);
    expect(onOpenSite).toHaveBeenCalledTimes(1);
  });

  it('exposes the locate control callback', () => {
    const onLocate = jest.fn();
    const screen = render(
      <ExploreMap
        coordinates={{ latitude: -33.0153, longitude: 27.9116 }}
        onOpenSite={jest.fn()}
        onLocate={onLocate}
      />,
    );

    fireEvent.press(screen.getByTestId('map-locate-control'));
    expect(onLocate).toHaveBeenCalledTimes(1);
  });
});