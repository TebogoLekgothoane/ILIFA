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

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}));

jest.mock('@/components/NarrationPlayer', () => ({
  NarrationPlayer: () => null,
}));

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

    expect(screen.getByText('Your camera is the time machine')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Enable camera'));
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByText('Your camera is the time machine')).toBeNull();
  });

  it('renders the camera after permission is granted', () => {
    const screen = render(<ExperienceScreen />);

    mockPermission = { granted: true, canAskAgain: true };
    screen.rerender(<ExperienceScreen />);

    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.queryByText('Your camera is the time machine')).toBeNull();
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
});
