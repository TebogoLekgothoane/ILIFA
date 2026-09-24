import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type IlifaLanguage = 'auto' | 'en' | 'xh';

export type IlifaGuideContext = {
  site: string;
  period: string;
  selectedFeature?: string;
};

export const DEFAULT_ILIFA_CONTEXT: IlifaGuideContext = {
  site: 'east_london_railway_station',
  period: 'early_1900s',
};

export type IlifaHistoryTurn = {
  question: string;
  answer: string;
};

export type IlifaAskRequest = IlifaGuideContext & {
  question?: string;
  audioBase64?: string;
  audioMimeType?: string;
  history?: IlifaHistoryTurn[];
  language?: IlifaLanguage;
};

export type IlifaAskResponse = {
  answer: string;
  question: string;
  language?: IlifaLanguage;
  audioUrl?: string | null;
  audioBase64?: string | null;
  audioMimeType?: string | null;
  sourceTopics: string[];
};

export class IlifaClientError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = 'unknown', status?: number) {
    super(message);
    this.name = 'IlifaClientError';
    this.code = code;
    this.status = status;
  }
}

export function getIlifaApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (configured) return configured;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri ?? '';
  const host = String(hostUri)
    .replace(/^\w+:\/\//, '')
    .split('/')[0]
    ?.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

function messageForStatus(status: number, fallback: string): { message: string; code: string } {
  if (status === 400) return { message: fallback || 'Ilifa could not use that question.', code: 'invalid_request' };
  if (status === 429) return { message: 'Too many questions right now. Please wait a moment and try again.', code: 'rate_limited' };
  if (status === 504) return { message: 'Ilifa took too long to answer. Please try again.', code: 'timeout' };
  if (status === 503) return { message: 'The heritage guide is unavailable right now.', code: 'backend_unavailable' };
  return { message: fallback || 'Ilifa could not answer just now.', code: 'network_failure' };
}

export async function generateIlifaResponse(
  request: IlifaAskRequest,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<IlifaAskResponse> {
  const timeoutMs = options?.timeoutMs ?? 70_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  options?.signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(`${getIlifaApiBaseUrl()}/api/ilifa/ask`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | (Partial<IlifaAskResponse> & { message?: string; code?: string })
      | null;

    if (!response.ok) {
      const mapped = messageForStatus(response.status, data?.message ?? '');
      throw new IlifaClientError(mapped.message, data?.code ?? mapped.code, response.status);
    }

    if (!data || typeof data.answer !== 'string' || data.answer.trim() === '') {
      throw new IlifaClientError('The guide returned an invalid response.', 'invalid_response', response.status);
    }

    const payload: IlifaAskResponse = {
      answer: data.answer.trim(),
      question: typeof data.question === 'string' ? data.question : request.question ?? '',
      language: data.language === 'xh' || data.language === 'en' || data.language === 'auto' ? data.language : request.language,
      audioUrl: data.audioUrl ?? null,
      audioBase64: data.audioBase64 ?? null,
      audioMimeType: data.audioMimeType ?? null,
      sourceTopics: Array.isArray(data.sourceTopics) ? data.sourceTopics.filter((topic): topic is string => typeof topic === 'string') : [],
    };

    if (JSON.stringify(payload).includes('AIza') || JSON.stringify(payload).includes('GEMINI_API_KEY')) {
      throw new IlifaClientError('The heritage guide is unavailable right now.', 'unsafe_payload');
    }

    return payload;
  } catch (error) {
    if (error instanceof IlifaClientError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new IlifaClientError('Ilifa took too long to answer. Please try again.', 'timeout');
    }
    throw new IlifaClientError('The heritage guide could not be reached. Check that the backend is running.', 'backend_unavailable');
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener('abort', onAbort);
  }
}

export function periodForYear(year: number): string {
  if (year === 2026) return 'present';
  if (year === 1950) return '1950s';
  return 'early_1900s';
}
