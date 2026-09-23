import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ExperienceScreen from '@/app/experience';

const mockRequestPermission = jest.fn();
let mockPermission: { granted: boolean; canAskAgain?: boolean } | null = null;

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: ({ testID = 'camera-view' }: { testID?: string }) =>
      React.createElement(View, { testID }),
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
  });

  it('requests camera access from the denied state and keeps the fallback visible', () => {
    const screen = render(<ExperienceScreen />);

    expect(screen.getByText('Your camera is the time machine')).toBeTruthy();
    fireEvent.press(screen.getByText('Enable camera'));

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Enable camera')).toBeTruthy();
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

    expect(screen.getByText('Camera access is required')).toBeTruthy();
  });
});