import {
  formatHeritageContext,
  getHeritageContext,
  sourceTopicsFor,
  visitorFeatureContext,
  type HeritageRecord,
} from "../data/heritage.ts";
import { encodeAudioForClient } from "../lib/wav.ts";
import { logger } from "../lib/logger.ts";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const TEXT_MODELS = (process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash-lite,gemini-3.8-flash")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const TTS_MODELS = (process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Charon";
const ASK_TIMEOUT_MS = 12_000;
const TTS_TIMEOUT_MS = 10_000;
const MODEL_COOLDOWN_MS = 90_000;

const modelCooldownUntil = new Map<string, number>();
let lastTextModel: string | null = null;
let lastTtsModel: string | null = null;

export type IlifaLanguage = "auto" | "en" | "xh";

export type IlifaHistoryTurn = {
  question: string;
  answer: string;
};

export type IlifaAskInput = {
  site?: string;
  period?: string;
  question?: string;
  audioBase64?: string;
  audioMimeType?: string;
  selectedFeature?: string;
  history?: IlifaHistoryTurn[];
  language?: IlifaLanguage;
};

export type IlifaAskResult = {
  answer: string;
  question: string;
  language: IlifaLanguage;
  audioBase64: string | null;
  audioMimeType: string | null;
  audioUrl: string | null;
  sourceTopics: string[];
};

export class IlifaServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = "gemini_failure") {
    super(message);
    this.name = "IlifaServiceError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeLanguage(value?: string): IlifaLanguage {
  const key = (value ?? "auto").trim().toLowerCase();
  if (key === "en" || key === "english") return "en";
  if (key === "xh" || key === "isixhosa" || key === "xhosa") return "xh";
  return "auto";
}

function languageInstruction(language: IlifaLanguage): string {
  if (language === "xh") {
    return `Answer in isiXhosa only. Use clear, conversational isiXhosa a visitor can understand.
The "question" field may still be a short English paraphrase for logs, but the "answer" must be isiXhosa.`;
  }
  if (language === "en") {
    return `Answer in English only.`;
  }
  return `Match the visitor's language.
If they ask in isiXhosa, answer in isiXhosa.
If they ask in English, answer in English.
If the spoken audio is isiXhosa, answer in isiXhosa.
Do not mix languages in one answer.`;
}

function speechStyle(language: IlifaLanguage): string {
  if (language === "xh") {
    return "calm, knowledgeable isiXhosa heritage guide, clear pronunciation, not theatrical";
  }
  return "calm, knowledgeable heritage guide, not theatrical";
}

function speechLanguageCode(language: IlifaLanguage): string | undefined {
  if (language === "xh") return "xh-ZA";
  if (language === "en") return "en-ZA";
  return undefined;
}

const SYSTEM_INSTRUCTION = `You are Ilifa, an AI heritage guide.

You explain historical places in a conversational and accessible way.

You must distinguish verified historical information from uncertainty.

Never invent dates, people, architectural details, events or historical claims.

If the available information does not answer a question, say that the information is not currently available.

You are currently guiding a visitor through East London Railway Station.

The visitor may be viewing a historical reconstruction of the station.

Answer naturally, like a knowledgeable local heritage guide.

Keep answers to 2–4 short spoken sentences. Be quick.

Do not sound like a textbook.

Do not repeatedly say 'according to my sources'.

Use simple language.

Return JSON only, with this shape:
{
  "question": "the visitor question restated briefly",
  "answer": "spoken heritage-guide answer",
  "sourceTopics": ["short topic labels used"],
  "available": true,
  "language": "en"
}

Set "language" to "xh" when the answer is in isiXhosa, otherwise "en".

If the records do not contain the answer, set available to false and say that plainly in the answer.`;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  error?: { message?: string; status?: string; code?: number };
};

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new IlifaServiceError("The heritage guide is not configured yet.", 503, "missing_key");
  }
  return apiKey;
}

export function payloadContainsSecret(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey && serialized.includes(apiKey)) return true;
  return /\bAIza[0-9A-Za-z_-]{20,}\b/.test(serialized);
}

export function parseModelJson(raw: string): {
  question: string;
  answer: string;
  sourceTopics: string[];
  language: IlifaLanguage;
} {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(trimmed) as {
    question?: unknown;
    answer?: unknown;
    sourceTopics?: unknown;
    language?: unknown;
  };

  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  if (!answer) {
    throw new IlifaServiceError("The guide returned an empty answer.", 502, "invalid_response");
  }

  return {
    question: typeof parsed.question === "string" ? parsed.question.trim() : "",
    answer,
    sourceTopics: Array.isArray(parsed.sourceTopics)
      ? parsed.sourceTopics.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0)
      : [],
    language: normalizeLanguage(typeof parsed.language === "string" ? parsed.language : undefined),
  };
}

export function buildIlifaPrompt(input: IlifaAskInput, records: HeritageRecord[]): string {
  const feature = visitorFeatureContext(input.selectedFeature);
  const language = normalizeLanguage(input.language);
  const history = (input.history ?? [])
    .slice(-4)
    .map((turn) => `Visitor: ${turn.question}\nIlifa: ${turn.answer}`)
    .join("\n");

  return [
    "Verified heritage context (use only this; do not add outside facts):",
    formatHeritageContext(records),
    `\nLanguage preference:\n${languageInstruction(language)}`,
    feature ? `\nVisitor context:\n${feature}` : "",
    history ? `\nRecent conversation:\n${history}` : "",
    input.question
      ? `\nThe visitor asked, in text:\n${input.question}`
      : "\nThe visitor asked by speaking. Use the attached audio as the question.",
    "\nIf a detail is not in the verified context, say the information is not currently available.",
  ]
    .filter(Boolean)
    .join("\n");
}

function mapGeminiError(error: unknown, fallback: string): IlifaServiceError {
  if (error instanceof IlifaServiceError) return error;

  const status = Number((error as { status?: number })?.status);
  const message = error instanceof Error ? error.message : fallback;

  if (status === 429 || /429|resource exhausted|rate|high demand/i.test(message)) {
    return new IlifaServiceError("Too many questions right now. Please wait a moment and try again.", 429, "rate_limited");
  }
  if (status === 401 || status === 403 || /api key|permission|unauth/i.test(message)) {
    return new IlifaServiceError("The heritage guide is unavailable right now.", 503, "auth_failure");
  }
  if (/timeout|timed out|aborted|deadline/i.test(message)) {
    return new IlifaServiceError("Ilifa took too long to answer. Please try again.", 504, "timeout");
  }

  logger.warn({ err: message }, "Gemini request failed");
  return new IlifaServiceError(fallback, 502, "gemini_failure");
}

async function generateContent(model: string, body: Record<string, unknown>, timeoutMs: number): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      const error = new Error(data.error?.message || "Gemini request failed");
      (error as Error & { status: number }).status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    throw mapGeminiError(error, "Ilifa could not answer just now.");
  } finally {
    clearTimeout(timer);
  }
}

export function rankModels(models: string[], preferred: string | null, now = Date.now()): string[] {
  const ready: string[] = [];
  const cooling: string[] = [];

  for (const model of models) {
    const cooled = (modelCooldownUntil.get(model) ?? 0) > now;
    if (cooled) cooling.push(model);
    else ready.push(model);
  }

  if (preferred && ready.includes(preferred)) {
    return [preferred, ...ready.filter((model) => model !== preferred), ...cooling.filter((model) => model !== preferred)];
  }

  return [...ready, ...cooling];
}

function markModelSuccess(model: string, kind: "text" | "tts"): void {
  modelCooldownUntil.delete(model);
  if (kind === "text") lastTextModel = model;
  else lastTtsModel = model;
}

function markModelFailure(model: string, error: unknown): void {
  if (error instanceof IlifaServiceError && (error.status === 429 || error.code === "rate_limited")) {
    modelCooldownUntil.set(model, Date.now() + MODEL_COOLDOWN_MS);
  }
}

function requestForModel(model: string, body: Record<string, unknown>): Record<string, unknown> {
  const generationConfig = { ...((body.generationConfig as Record<string, unknown> | undefined) ?? {}) };
  delete generationConfig.thinkingConfig;
  return { ...body, generationConfig };
}

async function generateContentWithFallback(
  models: string[],
  body: Record<string, unknown>,
  timeoutMs: number,
  kind: "text" | "tts",
): Promise<{ response: GeminiResponse; model: string }> {
  let lastError: unknown;
  const preferred = kind === "text" ? lastTextModel : lastTtsModel;
  const queue = rankModels(models, preferred);

  for (const [index, model] of queue.entries()) {
    try {
      const response = await generateContent(model, requestForModel(model, body), timeoutMs);
      markModelSuccess(model, kind);
      return { response, model };
    } catch (error) {
      lastError = error;
      markModelFailure(model, error);
      logger.warn(
        {
          model,
          attempt: index + 1,
          retry: index < queue.length - 1,
          err: error instanceof Error ? error.message : "unknown",
        },
        "Gemini attempt failed",
      );
    }
  }

  throw lastError instanceof IlifaServiceError
    ? lastError
    : new IlifaServiceError("Ilifa could not answer just now.", 502, "gemini_failure");
}

function textFromResponse(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("").trim();
}

function audioFromResponse(data: GeminiResponse): { data: string; mimeType?: string } | null {
  const inline = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!inline?.data) return null;
  return { data: inline.data, mimeType: inline.mimeType };
}

export async function generateIlifaResponse(input: IlifaAskInput): Promise<IlifaAskResult> {
  const question = input.question?.trim() ?? "";
  const hasAudio = Boolean(input.audioBase64?.trim());
  const preferredLanguage = normalizeLanguage(input.language);

  if (!question && !hasAudio) {
    throw new IlifaServiceError("Ask a question by voice or text.", 400, "empty_question");
  }

  const records = getHeritageContext(input.site, input.period, input.selectedFeature);
  const prompt = buildIlifaPrompt({ ...input, language: preferredLanguage }, records);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (hasAudio && input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: input.audioMimeType || "audio/m4a",
        data: input.audioBase64,
      },
    });
  }

  const textRequest = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  const { response } = await generateContentWithFallback(TEXT_MODELS, textRequest, ASK_TIMEOUT_MS, "text");

  const rawText = textFromResponse(response);
  if (!rawText) {
    throw new IlifaServiceError("The guide returned an invalid response.", 502, "invalid_response");
  }

  let parsed: ReturnType<typeof parseModelJson>;
  try {
    parsed = parseModelJson(rawText);
  } catch (error) {
    if (error instanceof IlifaServiceError) throw error;
    throw new IlifaServiceError("The guide returned an invalid response.", 502, "invalid_response");
  }

  const replyLanguage =
    preferredLanguage === "auto" ? (parsed.language === "xh" ? "xh" : "en") : preferredLanguage;

  const result: IlifaAskResult = {
    answer: parsed.answer,
    question: parsed.question || question,
    language: replyLanguage,
    audioBase64: null,
    audioMimeType: null,
    audioUrl: null,
    sourceTopics: parsed.sourceTopics.length > 0 ? parsed.sourceTopics : sourceTopicsFor(records),
  };

  try {
    const languageCode = speechLanguageCode(replyLanguage);
    const speechConfig: Record<string, unknown> = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: TTS_VOICE },
      },
    };
    if (languageCode) speechConfig.languageCode = languageCode;

    const { response: speech } = await generateContentWithFallback(
      TTS_MODELS,
      {
        contents: [
          {
            parts: [
              {
                text: result.answer,
                speechMetadata: {
                  style: speechStyle(replyLanguage),
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig,
        },
      },
      TTS_TIMEOUT_MS,
      "tts",
    );

    const inline = audioFromResponse(speech);
    if (inline) {
      const encoded = encodeAudioForClient(inline.data, inline.mimeType);
      result.audioBase64 = encoded.audioBase64;
      result.audioMimeType = encoded.audioMimeType;
    }
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? error.message : "unknown" },
      "Gemini speech generation failed; returning text only",
    );
  }

  if (payloadContainsSecret(result)) {
    throw new IlifaServiceError("The heritage guide is unavailable right now.", 502, "unsafe_payload");
  }

  return result;
}
