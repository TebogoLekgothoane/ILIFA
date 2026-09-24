import assert from "node:assert/strict";
import test from "node:test";
import { getHeritageContext } from "../data/heritage.ts";
import { buildIlifaPrompt, parseModelJson, payloadContainsSecret, rankModels } from "./gemini.ts";

test("builds a grounded prompt without inventing facts", () => {
  const records = getHeritageContext("east_london_railway_station", "early_1900s");
  const prompt = buildIlifaPrompt(
    {
      site: "east_london_railway_station",
      period: "early_1900s",
      question: "Why was this station important?",
      selectedFeature: "clock_tower",
      language: "xh",
    },
    records,
  );

  assert.match(prompt, /Why was this station important/);
  assert.match(prompt, /clock tower/);
  assert.match(prompt, /isiXhosa/i);
  assert.match(prompt, /do not add outside facts/i);
  assert.ok(!prompt.includes("GEMINI_API_KEY"));
});

test("parses a valid Ilifa JSON answer", () => {
  const parsed = parseModelJson(
    JSON.stringify({
      question: "Why was East London Railway Station important?",
      answer: "It connected the coastal city to a wider railway network.",
      sourceTopics: ["railway history", "East London"],
      available: true,
    }),
  );

  assert.equal(parsed.question, "Why was East London Railway Station important?");
  assert.match(parsed.answer, /connected/);
  assert.deepEqual(parsed.sourceTopics, ["railway history", "East London"]);
});

test("rejects an empty model answer", () => {
  assert.throws(() => parseModelJson(JSON.stringify({ answer: "   " })), /empty answer/);
});

test("tries the last working model first and keeps busy models last", () => {
  const ranked = rankModels(
    ["gemini-3.8-flash", "gemini-3.6-flash"],
    "gemini-3.6-flash",
  );
  assert.equal(ranked[0], "gemini-3.6-flash");
});

test("never treats a payload with an API-key pattern as safe", () => {
  assert.equal(payloadContainsSecret({ answer: "hello" }), false);
  assert.equal(payloadContainsSecret({ answer: "key AIzaSyD-example-should-not-leak-123456" }), true);
});
