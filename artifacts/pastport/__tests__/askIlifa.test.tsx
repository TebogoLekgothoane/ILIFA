import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AskIlifa } from '@/components/AskIlifa';
import { DEFAULT_ILIFA_CONTEXT } from '@/lib/ilifa';

const mockRequestPermission = jest.fn();
const mockStreamStart = jest.fn();
const mockStreamStop = jest.fn();
const mockFetchToken = jest.fn();
const mockCreateSession = jest.fn();
const mockSendText = jest.fn();
const mockSendAudioStreamEnd = jest.fn();
const mockSessionStop = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockRemove = jest.fn();
const mockWrite = jest.fn();

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: () => mockRequestPermission(),
  setAudioModeAsync: jest.fn(),
  useAudioStream: () => ({
    stream: {
      start: (...args: unknown[]) => mockStreamStart(...args),
      stop: (...args: unknown[]) => mockStreamStop(...args),
    },
    isStreaming: false,
  }),
  createAudioPlayer: () => ({
    play: mockPlay,
    pause: mockPause,
    remove: mockRemove,
    addListener: () => ({ remove: jest.fn() }),
    removeListener: jest.fn(),
  }),
}));

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  cacheDirectory: 'file://cache/',
  writeAsStringAsync: (...args: unknown[]) => mockWrite(...args),
}));

jest.mock('@/lib/ilifa', () => {
  const actual = jest.requireActual('@/lib/ilifa');
  return {
    ...actual,
    fetchIlifaLiveToken: (...args: unknown[]) => mockFetchToken(...args),
  };
});

jest.mock('@/lib/ilifaLiveSession', () => ({
  createIlifaLiveSession: (...args: unknown[]) => mockCreateSession(...args),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

describe('AskIlifa', () => {
  beforeEach(() => {
    mockRequestPermission.mockReset();
    mockStreamStart.mockReset();
    mockStreamStop.mockReset();
    mockFetchToken.mockReset();
    mockCreateSession.mockReset();
    mockSendText.mockReset();
    mockSendAudioStreamEnd.mockReset();
    mockSessionStop.mockReset();
    mockPlay.mockReset();
    mockPause.mockReset();
    mockRemove.mockReset();
    mockWrite.mockReset();

    mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true });
    mockStreamStart.mockResolvedValue(undefined);
    mockFetchToken.mockResolvedValue({
      token: 'auth_tokens/test-token',
      model: 'gemini-3.8-live',
      wsUrl:
        'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
      expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
    mockCreateSession.mockImplementation((_token, callbacks) => {
      queueMicrotask(() => {
        callbacks?.onReady?.();
        callbacks?.onPhase?.('listening');
      });
      return {
        sendPcmBase64: jest.fn(),
        sendAudioStreamEnd: mockSendAudioStreamEnd,
        sendText: (...args: unknown[]) => {
          mockSendText(...args);
          callbacks?.onTranscript?.({ role: 'user', text: String(args[0] ?? '') });
          callbacks?.onTranscript?.({
            role: 'model',
            text: 'The station connected East London to a wider railway network.',
          });
          callbacks?.onTurnComplete?.();
          callbacks?.onPhase?.('listening');
        },
        stop: mockSessionStop,
        isOpen: () => true,
      };
    });
  });

  it('opens a closable voice modal and shows the listening state', async () => {
    const onClose = jest.fn();
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Listening...')).toBeTruthy();
    });
    expect(screen.getByTestId('ask-ilifa-mic-listening')).toBeTruthy();
    expect(screen.getByTestId('ask-ilifa-close')).toBeTruthy();
    expect(screen.queryByText('Continue story')).toBeNull();
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockFetchToken).toHaveBeenCalled();
    expect(mockStreamStart).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('ask-ilifa-close'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('explains how to enable the microphone when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: false });
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-permission')).toBeTruthy();
    });
    expect(screen.getByText('Open microphone settings')).toBeTruthy();
    expect(screen.queryByText('Continue story')).toBeNull();
  });

  it('keeps listening after a reply so the user can ask again', async () => {
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-type')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('ask-ilifa-type'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Type a question about this place'),
      'Why was this station important?',
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('ask-ilifa-send-text'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-answer').props.children).toContain('connected East London');
    });
    expect(mockSendText).toHaveBeenCalledWith('Why was this station important?');
    expect(screen.getByText('Listening...')).toBeTruthy();
    expect(screen.queryByTestId('ask-ilifa-continue')).toBeNull();

    fireEvent.press(screen.getByTestId('ask-ilifa-type'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Type a question about this place'),
      'Who used this station?',
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('ask-ilifa-send-text'));
    });
    expect(mockSendText).toHaveBeenCalledTimes(2);
  });

  it('shows a retry state when the live token cannot be minted', async () => {
    mockFetchToken.mockRejectedValue(new Error('network down'));
    const screen = render(<AskIlifa context={DEFAULT_ILIFA_CONTEXT} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-ilifa-error')).toBeTruthy();
    });
    expect(screen.getByTestId('ask-ilifa-retry')).toBeTruthy();
    expect(screen.queryByTestId('ask-ilifa-connecting')).toBeNull();
    expect(screen.queryByText('Continue story')).toBeNull();
  });
});
