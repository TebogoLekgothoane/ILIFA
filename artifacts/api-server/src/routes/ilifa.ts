import { Router, type IRouter, type Request, type Response } from "express";
import {
  generateIlifaResponse,
  IlifaServiceError,
  normalizeLanguage,
  payloadContainsSecret,
  type IlifaHistoryTurn,
} from "../services/gemini.ts";
import { createIlifaLiveToken } from "../services/geminiLive.ts";
import { logger } from "../lib/logger.ts";

const router: IRouter = Router();

export type AskIlifaBody = {
  site?: unknown;
  period?: unknown;
  question?: unknown;
  audioBase64?: unknown;
  audioMimeType?: unknown;
  selectedFeature?: unknown;
  history?: unknown;
  language?: unknown;
};

export type LiveTokenBody = {
  site?: unknown;
  period?: unknown;
  selectedFeature?: unknown;
  language?: unknown;
};

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asHistory(value: unknown): IlifaHistoryTurn[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = asOptionalString((item as { question?: unknown }).question);
      const answer = asOptionalString((item as { answer?: unknown }).answer);
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is IlifaHistoryTurn => item !== null)
    .slice(-4);
}

export function validateAskIlifaBody(body: AskIlifaBody):
  | { ok: true; value: Parameters<typeof generateIlifaResponse>[0] }
  | { ok: false; message: string } {
  const site = asOptionalString(body.site) ?? "east_london_railway_station";
  const period = asOptionalString(body.period) ?? "early_1900s";
  const question = asOptionalString(body.question);
  const audioBase64 = asOptionalString(body.audioBase64);
  const audioMimeType = asOptionalString(body.audioMimeType);
  const selectedFeature = asOptionalString(body.selectedFeature);
  const history = asHistory(body.history);
  const language = normalizeLanguage(asOptionalString(body.language));

  if (!question && !audioBase64) {
    return { ok: false, message: "A spoken or typed question is required." };
  }

  if (audioBase64 && audioBase64.length < 80) {
    return { ok: false, message: "The recording was empty. Please ask again." };
  }

  return {
    ok: true,
    value: { site, period, question, audioBase64, audioMimeType, selectedFeature, history, language },
  };
}

export function validateLiveTokenBody(body: LiveTokenBody):
  | { ok: true; value: Parameters<typeof createIlifaLiveToken>[0] }
  | { ok: false; message: string } {
  const site = asOptionalString(body.site) ?? "east_london_railway_station";
  const period = asOptionalString(body.period) ?? "early_1900s";
  const selectedFeature = asOptionalString(body.selectedFeature);
  const language = normalizeLanguage(asOptionalString(body.language));

  return {
    ok: true,
    value: { site, period, selectedFeature, language },
  };
}

function sendError(res: Response, error: unknown) {
  if (error instanceof IlifaServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  logger.error({ err: error instanceof Error ? error.message : "unknown" }, "Ask Ilifa failed");
  res.status(502).json({ message: "Ilifa could not answer just now.", code: "backend_unavailable" });
}

router.post("/ilifa/ask", async (req: Request, res: Response) => {
  const parsed = validateAskIlifaBody((req.body ?? {}) as AskIlifaBody);
  if (!parsed.ok) {
    res.status(400).json({ message: parsed.message, code: "invalid_request" });
    return;
  }

  try {
    const result = await generateIlifaResponse(parsed.value);
    res.json({
      answer: result.answer,
      question: result.question,
      language: result.language,
      audioUrl: result.audioUrl,
      audioBase64: result.audioBase64,
      audioMimeType: result.audioMimeType,
      sourceTopics: result.sourceTopics,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/ilifa/live-token", async (req: Request, res: Response) => {
  const parsed = validateLiveTokenBody((req.body ?? {}) as LiveTokenBody);
  if (!parsed.ok) {
    res.status(400).json({ message: parsed.message, code: "invalid_request" });
    return;
  }

  try {
    const result = await createIlifaLiveToken(parsed.value);
    if (payloadContainsSecret(result)) {
      throw new IlifaServiceError("The heritage guide is unavailable right now.", 502, "unsafe_payload");
    }
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
