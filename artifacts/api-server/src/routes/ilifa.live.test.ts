import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBidiGenerateContentSetup,
  buildLiveSystemInstruction,
} from "../services/geminiLive.ts";
import { validateLiveTokenBody } from "./ilifa.ts";

test("live token body accepts heritage context defaults", () => {
  const result = validateLiveTokenBody({});
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.site, "east_london_railway_station");
    assert.equal(result.value.period, "early_1900s");
    assert.equal(result.value.language, "auto");
  }
});

test("live system instruction is spoken and grounded", () => {
  const instruction = buildLiveSystemInstruction({
    site: "east_london_railway_station",
    period: "early_1900s",
    selectedFeature: "clock_tower",
    language: "xh",
  });

  assert.match(instruction, /Ilifa/i);
  assert.match(instruction, /clock tower/i);
  assert.match(instruction, /isiXhosa/i);
  assert.match(instruction, /do not add outside facts/i);
  assert.doesNotMatch(instruction, /Return JSON only/i);
  assert.ok(!instruction.includes("GEMINI_API_KEY"));
  assert.ok(!instruction.includes("AIza"));
});

test("live setup locks model and audio modality", () => {
  const setup = buildBidiGenerateContentSetup({
    site: "east_london_railway_station",
    period: "early_1900s",
    language: "en",
  });

  assert.equal(setup.model, "models/gemini-3.8-live");
  assert.deepEqual(setup.generationConfig.responseModalities, ["AUDIO"]);
  assert.equal(
    (setup.generationConfig.speechConfig as { languageCode?: string }).languageCode,
    "en-ZA",
  );
  assert.ok(setup.inputAudioTranscription);
  assert.ok(setup.outputAudioTranscription);
  assert.match(JSON.stringify(setup), /East London Railway Station/i);
  assert.ok(!JSON.stringify(setup).includes("AIza"));
});
