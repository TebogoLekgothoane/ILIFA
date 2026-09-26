import assert from "node:assert/strict";
import test from "node:test";
import { createIlifaLiveToken } from "./geminiLive.ts";

test("createIlifaLiveToken posts a constrained auth token request", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "AIzaSyTestKeyThatMustNotLeak1234567890";

  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedBody: Record<string, unknown> | null = null;
  let capturedHeaders: HeadersInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedHeaders = init?.headers;
    capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        name: "auth_tokens/ephemeral-test",
        expireTime: "2030-01-01T00:00:00Z",
        newSessionExpireTime: "2030-01-01T00:01:00Z",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await createIlifaLiveToken({
      site: "east_london_railway_station",
      period: "early_1900s",
      language: "en",
    });

    assert.match(capturedUrl, /v1alpha\/auth_tokens/);
    assert.equal(capturedBody?.uses, 1);
    const setup = capturedBody?.bidiGenerateContentSetup as {
      model?: string;
      generationConfig?: { responseModalities?: string[] };
    };
    assert.equal(setup.model, "models/gemini-3.8-live");
    assert.deepEqual(setup.generationConfig?.responseModalities, ["AUDIO"]);
    assert.equal(result.token, "auth_tokens/ephemeral-test");
    assert.equal(result.model, "gemini-3.8-live");
    assert.match(result.wsUrl, /BidiGenerateContentConstrained/);
    assert.match(result.wsUrl, /v1beta/);
    assert.ok(!JSON.stringify(result).includes("AIzaSyTestKeyThatMustNotLeak1234567890"));
    assert.ok(!JSON.stringify(capturedBody).includes("AIzaSyTestKeyThatMustNotLeak1234567890"));

    const headers = new Headers(capturedHeaders);
    assert.equal(headers.get("x-goog-api-key"), "AIzaSyTestKeyThatMustNotLeak1234567890");
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
