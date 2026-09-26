import {
  formatHeritageContext,
  getHeritageContext,
  visitorFeatureContext,
} from "../data/heritage.ts";
import { logger } from "../lib/logger.ts";
import {
  IlifaServiceError,
  normalizeLanguage,
  payloadContainsSecret,
  type IlifaLanguage,
} from "./gemini.ts";

const GEMINI_AUTH_BASE = "https://generativelanguage.googleapis.com/v1alpha";
const LIVE_MODEL = (process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live").trim() || "gemini-3.8-live";
const LIVE_VOICE = process.env.GEMINI_TTS_VOICE || "Charon";
const LIVE_WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";
const TOKEN_TIMEOUT_MS = 12_000;

export type IlifaLiveTokenInput = {
  site?: string;
  period?: string;
  selectedFeature?: string;
  language?: IlifaLanguage;
};

export type IlifaLiveTokenResult = {
  token: string;
  model: string;
  wsUrl: string;
  expireTime: string;
  newSessionExpireTime: string;
};

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new IlifaServiceError("The heritage guide is not configured yet.", 503, "missing_key");
  }
  return apiKey;
}

function languageInstruction(language: IlifaLanguage): string {
  if (language === "xh") {
    return "Speak only in isiXhosa. Use clear, conversational isiXhosa a visitor can understand.";
  }
  if (language === "en") {
    return "Speak only in English.";
  }
  return `Match the visitor's language.
If they speak or write in isiXhosa, reply in isiXhosa.
If they speak or write in English, reply in English.
Do not mix languages in one answer.`;
}

export function buildLiveSystemInstruction(input: IlifaLiveTokenInput): string {
  const language = normalizeLanguage(input.language);
  const records = getHeritageContext(input.site, input.period, input.selectedFeature);
  const feature = visitorFeatureContext(input.selectedFeature);

  return [
    `You are Ilifa, an AI heritage guide.

You explain historical places in a conversational and accessible way.

You must distinguish verified historical information from uncertainty.

Never invent dates, people, architectural details, events or historical claims.

If the available information does not answer a question, say that the information is not currently available.

You are currently guiding a visitor through East London Railway Station.

The visitor may be viewing a historical reconstruction of the station.

Answer naturally by voice, like a knowledgeable local heritage guide.

This is a live, multi-turn conversation. After each answer, stay with the visitor and always speak a reply to the next question or comment. Never go silent after one answer.

Keep answers to 2–4 short spoken sentences. Be quick.

Do not sound like a textbook.

Do not repeatedly say 'according to my sources'.

Use simple language.

Do not return JSON or read out structured data formats.`,
    "Verified heritage context (use only this; do not add outside facts):",
    formatHeritageContext(records),
    `Language preference:\n${languageInstruction(language)}`,
    feature ? `Visitor context:\n${feature}` : "",
    "If a detail is not in the verified context, say the information is not currently available.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildBidiGenerateContentSetup(input: IlifaLiveTokenInput) {
  const language = normalizeLanguage(input.language);
  const speechConfig: Record<string, unknown> = {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: LIVE_VOICE },
    },
  };
  if (language === "xh") speechConfig.languageCode = "xh-ZA";
  if (language === "en") speechConfig.languageCode = "en-ZA";

  // REST auth_tokens expects `bidiGenerateContentSetup` (not the SDK's liveConnectConstraints).
  return {
    model: `models/${LIVE_MODEL}`,
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig,
    },
    systemInstruction: {
      parts: [{ text: buildLiveSystemInstruction(input) }],
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };
}

/** @deprecated Prefer buildBidiGenerateContentSetup — kept for older imports/tests. */
export function buildLiveConnectConstraints(input: IlifaLiveTokenInput) {
  const setup = buildBidiGenerateContentSetup(input);
  return {
    model: setup.model,
    config: {
      responseModalities: setup.generationConfig.responseModalities,
      systemInstruction: setup.systemInstruction,
      speechConfig: setup.generationConfig.speechConfig,
      inputAudioTranscription: setup.inputAudioTranscription,
      outputAudioTranscription: setup.outputAudioTranscription,
    },
  };
}

type AuthTokenResponse = {
  name?: string;
  expireTime?: string;
  newSessionExpireTime?: string;
  error?: { message?: string; status?: string; code?: number };
};

function mapTokenError(error: unknown): IlifaServiceError {
  if (error instanceof IlifaServiceError) return error;

  const status = Number((error as { status?: number })?.status);
  const message = error instanceof Error ? error.message : "Could not start a live guide session.";

  if (status === 429 || /429|resource exhausted|rate|high demand/i.test(message)) {
    return new IlifaServiceError("Too many questions right now. Please wait a moment and try again.", 429, "rate_limited");
  }
  if (status === 401 || status === 403 || /api key|permission|unauth/i.test(message)) {
    return new IlifaServiceError("The heritage guide is unavailable right now.", 503, "auth_failure");
  }
  if (/timeout|timed out|aborted|deadline/i.test(message)) {
    return new IlifaServiceError("Ilifa took too long to connect. Please try again.", 504, "timeout");
  }

  logger.warn({ err: message }, "Gemini live token request failed");
  return new IlifaServiceError("Could not start a live guide session.", 502, "gemini_failure");
}

export async function createIlifaLiveToken(input: IlifaLiveTokenInput): Promise<IlifaLiveTokenResult> {
  const apiKey = getApiKey();
  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_AUTH_BASE}/auth_tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        newSessionExpireTime,
        bidiGenerateContentSetup: buildBidiGenerateContentSetup(input),
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as AuthTokenResponse;
    if (!response.ok) {
      const error = new Error(data.error?.message || "Gemini live token request failed");
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    const token = data.name?.trim();
    if (!token) {
      throw new IlifaServiceError("Could not start a live guide session.", 502, "invalid_response");
    }

    const result: IlifaLiveTokenResult = {
      token,
      model: LIVE_MODEL,
      wsUrl: LIVE_WS_URL,
      expireTime: data.expireTime || expireTime,
      newSessionExpireTime: data.newSessionExpireTime || newSessionExpireTime,
    };

    if (payloadContainsSecret(result) || result.token === apiKey) {
      throw new IlifaServiceError("The heritage guide is unavailable right now.", 502, "unsafe_payload");
    }

    return result;
  } catch (error) {
    throw mapTokenError(error);
  } finally {
    clearTimeout(timer);
  }
}

export function getLiveModel(): string {
  return LIVE_MODEL;
}
