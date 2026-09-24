import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ExperienceScreen from '@/app/experience';

const mockRequestPermission = jest.fn();
let mockPermission: { granted: boolean; canAskAgain?: boolean } | null = null;

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: ({ testID = 'camera-view', onMountError }: { testID?: string; onMountError?: (event: { message: string }) => void }) =>
      React.createElement(View, { testID, onMountError }),
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
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
    VideoView: () => React.createElement(View, { testID: 'story-video' }),
    useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
  };
});

jest.mock('@/context/PastportContext', () => ({
  usePastport: () => ({
    selectedYear: 1920,
    setSelectedYear: jest.fn(),
    markVisited: jest.fn(),
  }),
}));

describe('ExperienceScreen camera permissions', () => {
  beforeEach(() => {
    mockPermission = { granted: false, canAskAgain: true };
    mockRequestPermission.mockReset();
    mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true });
  });

  it('mounts the camera as soon as the permission request succeeds', async () => {
    const screen = render(<ExperienceScreen />);

    expect(screen.getByText('Camera access is needed to experience the past.')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Enable Camera'));
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByText('Camera access is needed to experience the past.')).toBeNull();
  });

  it('renders the camera after permission is granted', () => {
    const screen = render(<ExperienceScreen />);

    mockPermission = { granted: true, canAskAgain: true };
    screen.rerender(<ExperienceScreen />);

    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByText('Camera access is needed to experience the past.')).toBeNull();
  });

  it('shows the non-retry copy when camera access cannot be requested again', () => {
    mockPermission = { granted: false, canAskAgain: false };

    const screen = render(<ExperienceScreen />);

    expect(screen.getByText('Open camera settings')).toBeTruthy();
  });

  it('reports a camera startup error instead of leaving a blank preview', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    const screen = render(<ExperienceScreen />);
    const camera = screen.getByTestId('camera-view');

    // The mock does not emit native events, so invoke the callback captured by the rendered props.
    const cameraProps = (camera as unknown as { props: { onMountError: (event: { message: string }) => void } }).props;
    await act(async () => {
      cameraProps.onMountError({ message: 'No camera is available.' });
    });

    expect(screen.getByText('Camera unavailable')).toBeTruthy();
    expect(screen.getByText('No camera is available.')).toBeTruthy();
  });

  it('scans the building, names East London Railway Station, then shows the model above the stories and audio', () => {
    jest.useFakeTimers();
    mockPermission = { granted: true, canAskAgain: true };
    const screen = render(<ExperienceScreen />);

    fireEvent.press(screen.getByTestId('show-me-then'));

    expect(screen.getByText('AI SCANNING')).toBeTruthy();
    expect(screen.getByText('Reading the building')).toBeTruthy();
    expect(screen.queryByTestId('story-rail')).toBeNull();
    expect(screen.queryByTestId('experience-narration')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2200);
    });

    expect(screen.getByText('BUILDING DETECTED')).toBeTruthy();
    expect(screen.getByTestId('detected-station').props.children).toBe('East London Railway Station');
    expect(screen.queryByTestId('story-rail')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(screen.getByTestId('model-stage')).toBeTruthy();
    expect(screen.getByTestId('model-gesture-area')).toBeTruthy();
    expect(screen.getByText('Drag to turn the station')).toBeTruthy();
    expect(screen.getByTestId('story-rail')).toBeTruthy();
    expect(screen.getByText('The arrival hall')).toBeTruthy();
    expect(screen.getByTestId('experience-narration')).toBeTruthy();
    const stage = screen.getByTestId('model-stage');
    const stories = screen.getByTestId('story-rail');
    const narration = screen.getByTestId('experience-narration');
    expect(stage).toBeTruthy();
    expect(stories).toBeTruthy();
    expect(narration).toBeTruthy();
    fireEvent.press(screen.getByTestId('story-ad-arrival-hall'));
    expect(screen.getByTestId('story-video-sheet')).toBeTruthy();
    expect(screen.getByTestId('story-video')).toBeTruthy();
    expect(screen.getByText('Nomsa Dlamini')).toBeTruthy();
    expect(screen.getByText('East London · lived beside the station')).toBeTruthy();

    fireEvent.press(screen.getByTestId('story-sheet-close'));
    expect(screen.queryByTestId('story-video-sheet')).toBeNull();

    screen.unmount();
    jest.useRealTimers();
  });
});
