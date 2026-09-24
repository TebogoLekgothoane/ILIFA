import assert from "node:assert/strict";
import test from "node:test";
import {
  EAST_LONDON_RAILWAY_STATION,
  formatHeritageContext,
  getHeritageContext,
  normalizePeriod,
  normalizeSite,
  sourceTopicsFor,
  visitorFeatureContext,
} from "./heritage.ts";

test("normalizes East London site aliases", () => {
  assert.equal(normalizeSite("east-london-station"), EAST_LONDON_RAILWAY_STATION);
  assert.equal(normalizeSite("east_london_railway_station"), EAST_LONDON_RAILWAY_STATION);
});

test("maps 1920 to the early 1900s period", () => {
  assert.equal(normalizePeriod("1920"), "early_1900s");
  assert.equal(normalizePeriod("early_1900s"), "early_1900s");
});

test("returns only records for the requested site and period", () => {
  const records = getHeritageContext("east_london_railway_station", "early_1900s");
  assert.ok(records.length > 0);
  assert.ok(records.every((record) => record.site === EAST_LONDON_RAILWAY_STATION));
  assert.ok(records.some((record) => record.period === "early_1900s"));
  assert.ok(records.every((record) => record.period === "general" || record.period === "early_1900s"));
});

test("does not invent source names", () => {
  const records = getHeritageContext("east_london_railway_station", "early_1900s");
  for (const record of records) {
    assert.ok(
      record.source === "PASTPORT heritage record" ||
        record.source === "PASTPORT demo archive" ||
        record.source === "AI reconstruction",
    );
  }
});

test("feature context is optional and descriptive", () => {
  assert.equal(visitorFeatureContext(), null);
  assert.equal(visitorFeatureContext("clock_tower"), "The visitor is currently examining the station clock tower.");
});

test("formats compact grounded context", () => {
  const records = getHeritageContext("east_london_railway_station", "early_1900s");
  const formatted = formatHeritageContext(records);
  assert.match(formatted, /East London Railway Station/);
  assert.ok(!formatted.includes("AIza"));
  assert.ok(sourceTopicsFor(records).includes("railway history"));
});
