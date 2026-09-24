import assert from "node:assert/strict";
import test from "node:test";
import { validateAskIlifaBody } from "./ilifa.ts";

test("requires a question or audio", () => {
  const result = validateAskIlifaBody({});
  assert.equal(result.ok, false);
});

test("accepts the documented Ask Ilifa request shape", () => {
  const result = validateAskIlifaBody({
    site: "east_london_railway_station",
    period: "early_1900s",
    question: "Why was this station important?",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.site, "east_london_railway_station");
    assert.equal(result.value.period, "early_1900s");
    assert.equal(result.value.question, "Why was this station important?");
  }
});

test("rejects an empty recording", () => {
  const result = validateAskIlifaBody({
    site: "east_london_railway_station",
    audioBase64: "abc",
  });
  assert.equal(result.ok, false);
});
