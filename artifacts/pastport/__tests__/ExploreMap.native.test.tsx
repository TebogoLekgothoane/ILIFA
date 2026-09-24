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

  it('starts navigation from the bottom-left control', () => {
    const onNavigate = jest.fn();
    const screen = render(
      <ExploreMap
        coordinates={{ latitude: -33.0153, longitude: 27.9116 }}
        onOpenSite={jest.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.press(screen.getByTestId('map-navigate-control'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Start navigation')).toBeTruthy();
  });

  it('renders only the supplied visited markers and frames them with the given region', () => {
    const onPress = jest.fn();
    const coordinate = { latitude: -33.0153, longitude: 27.9116 };
    const screen = render(
      <ExploreMap
        coordinates={coordinate}
        latitudeDelta={0.08}
        longitudeDelta={0.08}
        markers={[
          {
            title: 'East London Railway Station',
            description: 'Eastern Cape',
            coordinate,
            featured: true,
            onPress,
          },
        ]}
      />,
    );

    expect(screen.getByTestId('native-map').props.initialRegion).toEqual({
      ...coordinate,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(1);
    expect(markers[0].props.title).toBe('East London Railway Station');
    expect(screen.queryByTestId('map-locate-control')).toBeNull();

    fireEvent.press(markers[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});