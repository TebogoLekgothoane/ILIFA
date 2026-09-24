import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AskIlifa } from '@/components/AskIlifa';
import { DEFAULT_ILIFA_CONTEXT } from '@/lib/ilifa';

const mockRequestPermission = jest.fn();
const mockPrepare = jest.fn();
const mockRecord = jest.fn();
const mockStop = jest.fn();
const mockGenerate = jest.fn();
const mockRead = jest.fn();
const mockWrite = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: { extension: '.m4a' } },
  requestRecordingPermissionsAsync: () => mockRequestPermission(),
  setAudioModeAsync: jest.fn(),
  useAudioRecorder: () => ({
    prepareToRecordAsync: mockPrepare,
    record: mockRecord,
    stop: mockStop,
    uri: 'file://recording.m4a',
  }),
  useAudioRecorderState: () => ({ durationMillis: 1800, isRecording: true }),
  createAudioPlayer: () => ({ play: mockPlay, pause: mockPause, remove: mockRemove }),
}));

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  cacheDirectory: 'file://cache/',
  readAsStringAsync: (...args: unknown[]) => mockRead(...args),
  writeAsStringAsync: (...args: unknown[]) => mockWrite(...args),
}));

jest.mock('@/lib/ilifa', () => {
  const actual = jest.requireActual('@/lib/ilifa');
  return {
    ...actual,
    generateIlifaResponse: (...args: unknown[]) => mockGenerate(...args),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

describe('AskIlifa', () => {
  beforeEach(() => {
    mockRequestPermission.mockReset();
    mockPrepare.mockReset();
    mockRecord.mockReset();
    mockStop.mockReset();
    mockGenerate.mockReset();
    mockRead.mockReset();
    mockWrite.mockReset();
    mockPlay.mockReset();
    mockPause.mockReset();
    mockRemove.mockReset();
    mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true });
    mockPrepare.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
    mockRead.mockResolvedValue('dGVzdA==');
    mockGenerate.mockResolvedValue({
      answer: 'The station connected East London to a wider railway network.',
      question: 'Why was this station important?',
      audioBase64: null,
      sourceTopics: ['railway history'],
    });
  });

  it('asks for the microphone and shows the listening state', async () => {
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onContinueStory={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Listening...')).toBeTruthy();
    });
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalled();
  });

  it('explains how to enable the microphone when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: false });
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onContinueStory={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-permission')).toBeTruthy();
    });
    expect(screen.getByText('Open microphone settings')).toBeTruthy();
  });

  it('sends a typed question and can continue the story', async () => {
    const onContinueStory = jest.fn();
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onContinueStory={onContinueStory} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-type')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('ask-ilifa-type'));
    fireEvent.changeText(screen.getByPlaceholderText('Type a question about this place'), 'Why was this station important?');

    await act(async () => {
      fireEvent.press(screen.getByTestId('ask-ilifa-send-text'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-answer').props.children).toContain('connected East London');
    });
    expect(mockGenerate).toHaveBeenCalled();
    const payload = mockGenerate.mock.calls[0][0] as { question: string; site: string };
    expect(payload.question).toBe('Why was this station important?');
    expect(payload.site).toBe('east_london_railway_station');
    expect(JSON.stringify(payload)).not.toContain('AIza');
    expect(JSON.stringify(payload)).not.toContain('GEMINI');

    fireEvent.press(screen.getByTestId('ask-ilifa-continue'));
    expect(onContinueStory).toHaveBeenCalled();
  });

  it('shows a retry state instead of staying on thinking', async () => {
    mockGenerate.mockRejectedValue(new Error('network down'));
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onContinueStory={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-type')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('ask-ilifa-type'));
    fireEvent.changeText(screen.getByPlaceholderText('Type a question about this place'), 'What did it look like?');

    await act(async () => {
      fireEvent.press(screen.getByTestId('ask-ilifa-send-text'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-error')).toBeTruthy();
    });
    expect(screen.getByTestId('ask-ilifa-retry')).toBeTruthy();
    expect(screen.queryByTestId('ask-ilifa-thinking')).toBeNull();
  });
});
