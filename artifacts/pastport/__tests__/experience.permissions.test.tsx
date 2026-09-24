import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ExperienceScreen from '@/app/experience';

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: ({ testID = 'live-camera-view' }: { testID?: string }) =>
      React.createElement(View, { testID }),
    useCameraPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn()],
  };
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}));

jest.mock('@/components/HistoricalModel', () => ({
  HistoricalModel: () => null,
}));

jest.mock('@/components/NarrationPlayer', () => ({
  NarrationPlayer: () => null,
}));

jest.mock('@/components/AskIlifa', () => ({
  AskIlifa: () => null,
}));

jest.mock('@/components/StationAmbience', () => ({
  StationAmbience: () => null,
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    VideoView: ({ testID }: { testID?: string }) => React.createElement(View, { testID: testID ?? 'story-video' }),
    useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn(), loop: true, muted: true }),
  };
});

jest.mock('@/context/PastportContext', () => ({
  usePastport: () => ({
    selectedYear: 1920,
    setSelectedYear: jest.fn(),
    markVisited: jest.fn(),
  }),
}));

describe('ExperienceScreen demo camera feed', () => {
  it('shows the demo location video instead of asking for camera permission', () => {
    const screen = render(<ExperienceScreen />);

    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByText('Camera access is needed to experience the past.')).toBeNull();
    expect(screen.queryByText('Enable Camera')).toBeNull();
  });

  it('scans the building, names East London Railway Station, then shows the model above the stories and audio', () => {
    jest.useFakeTimers();
    const screen = render(<ExperienceScreen />);

    fireEvent.press(screen.getByTestId('show-me-then'));

    expect(screen.getByTestId('full-scan-overlay')).toBeTruthy();
    expect(screen.getByText('AI SCANNING')).toBeTruthy();
    expect(screen.getByText('Reading the building')).toBeTruthy();
    expect(screen.queryByTestId('story-rail')).toBeNull();
    expect(screen.queryByTestId('experience-narration')).toBeNull();
    expect(screen.queryByTestId('model-stage')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2200);
    });

    expect(screen.queryByTestId('full-scan-overlay')).toBeNull();
    expect(screen.getByText('BUILDING DETECTED')).toBeTruthy();
    expect(screen.getByTestId('detected-station').props.children).toBe('East London Railway Station');
    expect(screen.queryByTestId('story-rail')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(screen.getByTestId('model-stage')).toBeTruthy();
    expect(screen.getByTestId('model-gesture-area')).toBeTruthy();
    expect(screen.getByText('Drag to orbit · pinch to zoom')).toBeTruthy();
    expect(screen.getByTestId('story-rail')).toBeTruthy();
    expect(screen.getByText('The arrival hall')).toBeTruthy();
    expect(screen.getByTestId('experience-narration')).toBeTruthy();
    fireEvent.press(screen.getByTestId('story-ad-arrival-hall'));
    expect(screen.getByTestId('story-video-sheet')).toBeTruthy();
    expect(screen.getByText('Nomsa Dlamini')).toBeTruthy();
    expect(screen.getByText('East London · lived beside the station')).toBeTruthy();

    fireEvent.press(screen.getByTestId('story-sheet-close'));
    expect(screen.queryByTestId('story-video-sheet')).toBeNull();

    screen.unmount();
    jest.useRealTimers();
  });
});
