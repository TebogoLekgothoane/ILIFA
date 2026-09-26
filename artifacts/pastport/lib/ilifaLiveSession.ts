export type LiveSessionPhase = 'connecting' | 'listening' | 'speaking' | 'error';

export type LiveTranscript = {
  role: 'user' | 'model';
  text: string;
};

export type IlifaLiveToken = {
  token: string;
  model: string;
  wsUrl: string;
  expireTime: string;
  newSessionExpireTime?: string;
};

type ServerMessage = {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    interrupted?: boolean;
    turnComplete?: boolean;
    generationComplete?: boolean;
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;
    };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
  toolCall?: unknown;
  goAway?: unknown;
  error?: { message?: string; code?: number | string; status?: string };
};

export type IlifaLiveSessionCallbacks = {
  onPhase?: (phase: LiveSessionPhase) => void;
  onTranscript?: (transcript: LiveTranscript) => void;
  onAudio?: (pcmBase64: string, sampleRate: number) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onError?: (message: string) => void;
  onReady?: () => void;
  onDisconnected?: () => void;
};

export type IlifaLiveSession = {
  sendPcmBase64: (base64: string, sampleRate?: number) => void;
  sendText: (text: string) => void;
  sendAudioStreamEnd: () => void;
  stop: () => void;
  isOpen: () => boolean;
};

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;
const SETUP_TIMEOUT_MS = 12_000;

export function createIlifaLiveSession(
  token: IlifaLiveToken,
  callbacks: IlifaLiveSessionCallbacks = {},
): IlifaLiveSession {
  const accessToken = encodeURIComponent(token.token);
  // Ephemeral tokens should use the Constrained Live endpoint (prefer v1beta).
  const baseUrl = normalizeLiveWsUrl(token.wsUrl);
  const url = `${baseUrl}?access_token=${accessToken}`;
  const model = token.model.startsWith('models/') ? token.model : `models/${token.model}`;

  let socket: WebSocket | null = null;
  let closed = false;
  let setupDone = false;
  let userTranscript = '';
  let modelTranscript = '';
  let setupTimer: ReturnType<typeof setTimeout> | null = null;

  callbacks.onPhase?.('connecting');

  try {
    socket = new WebSocket(url);
  } catch {
    callbacks.onPhase?.('error');
    callbacks.onError?.('Could not open a live connection to Ilifa.');
    return deadSession();
  }

  setupTimer = setTimeout(() => {
    if (closed || setupDone) return;
    callbacks.onPhase?.('error');
    callbacks.onError?.('Ilifa took too long to connect. Check your network and try again.');
    stop();
  }, SETUP_TIMEOUT_MS);

  socket.onopen = () => {
    if (!socket || closed) return;
    // Match the server-locked setup closely enough for constrained sessions.
    socket.send(
      JSON.stringify({
        setup: {
          model,
          generationConfig: {
            responseModalities: ['AUDIO'],
          },
        },
      }),
    );
  };

  socket.onmessage = (event) => {
    if (closed) return;
    void (async () => {
      try {
        const raw = await decodeWsData(event.data);
        await handleMessage(raw);
      } catch {
        // Ignore malformed frames; keep waiting for setupComplete / content.
      }
    })();
  };

  socket.onerror = () => {
    if (closed) return;
    if (!setupDone) {
      clearSetupTimer();
      callbacks.onPhase?.('error');
      callbacks.onError?.('The live guide connection failed.');
    }
  };

  socket.onclose = () => {
    if (closed) return;
    closed = true;
    clearSetupTimer();
    if (!setupDone) {
      callbacks.onPhase?.('error');
      callbacks.onError?.('The live guide disconnected before it was ready.');
      return;
    }
    callbacks.onDisconnected?.();
  };

  async function handleMessage(raw: string) {
    let message: ServerMessage;
    try {
      message = JSON.parse(raw) as ServerMessage;
    } catch {
      return;
    }

    if (message.error?.message) {
      clearSetupTimer();
      callbacks.onPhase?.('error');
      callbacks.onError?.(String(message.error.message));
      return;
    }

    if (message.setupComplete) {
      setupDone = true;
      clearSetupTimer();
      callbacks.onPhase?.('listening');
      callbacks.onReady?.();
      return;
    }

    if (message.goAway) {
      callbacks.onDisconnected?.();
    }

    const content = message.serverContent;
    if (!content) return;

    if (content.interrupted) {
      callbacks.onInterrupted?.();
      callbacks.onPhase?.('listening');
    }

    const inputText = content.inputTranscription?.text?.trim();
    if (inputText) {
      userTranscript = `${userTranscript} ${inputText}`.trim();
      callbacks.onTranscript?.({ role: 'user', text: userTranscript });
    }

    const outputText = content.outputTranscription?.text?.trim();
    if (outputText) {
      modelTranscript = `${modelTranscript} ${outputText}`.trim();
      callbacks.onTranscript?.({ role: 'model', text: modelTranscript });
    }

    const parts = content.modelTurn?.parts ?? [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      if (!data) continue;
      callbacks.onPhase?.('speaking');
      const rate = rateFromMime(part.inlineData?.mimeType) ?? OUTPUT_RATE;
      callbacks.onAudio?.(data, rate);
    }

    if (content.turnComplete || content.generationComplete) {
      userTranscript = '';
      modelTranscript = '';
      callbacks.onTurnComplete?.();
      callbacks.onPhase?.('listening');
    }
  }

  function sendPcmBase64(base64: string, sampleRate = INPUT_RATE) {
    if (!socket || socket.readyState !== WebSocket.OPEN || closed || !setupDone) return;
    if (!base64) return;
    socket.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: `audio/pcm;rate=${sampleRate}`,
            data: base64,
          },
        },
      }),
    );
  }

  function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !socket || socket.readyState !== WebSocket.OPEN || closed || !setupDone) return;
    userTranscript = trimmed;
    callbacks.onTranscript?.({ role: 'user', text: trimmed });
    socket.send(
      JSON.stringify({
        realtimeInput: {
          text: trimmed,
        },
      }),
    );
  }

  function sendAudioStreamEnd() {
    if (!socket || socket.readyState !== WebSocket.OPEN || closed || !setupDone) return;
    socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
  }

  function clearSetupTimer() {
    if (setupTimer) {
      clearTimeout(setupTimer);
      setupTimer = null;
    }
  }

  function stop() {
    closed = true;
    clearSetupTimer();
    try {
      socket?.close();
    } catch {
      // Ignore close errors.
    }
    socket = null;
  }

  return {
    sendPcmBase64,
    sendText,
    sendAudioStreamEnd,
    stop,
    isOpen: () => Boolean(socket && socket.readyState === WebSocket.OPEN && setupDone && !closed),
  };
}

function normalizeLiveWsUrl(wsUrl: string): string {
  const cleaned = wsUrl.replace(/\?.*$/, '').trim();
  if (cleaned.includes('BidiGenerateContentConstrained')) {
    // Prefer v1beta for ephemeral/constrained sessions per Live API docs.
    return cleaned.replace(
      /\.v1alpha\.GenerativeService\.BidiGenerateContentConstrained/i,
      '.v1beta.GenerativeService.BidiGenerateContentConstrained',
    );
  }
  return 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
}

async function decodeWsData(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new TextDecoder().decode(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return await data.text();
  }
  return String(data ?? '');
}

function rateFromMime(mimeType?: string): number | null {
  if (!mimeType) return null;
  const match = /rate=(\d+)/i.exec(mimeType);
  if (!match?.[1]) return null;
  const rate = Number(match[1]);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

function deadSession(): IlifaLiveSession {
  return {
    sendPcmBase64: () => undefined,
    sendText: () => undefined,
    sendAudioStreamEnd: () => undefined,
    stop: () => undefined,
    isOpen: () => false,
  };
}
