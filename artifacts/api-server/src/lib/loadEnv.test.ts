import assert from "node:assert/strict";
import test from "node:test";
import { parseEnvFile } from "./loadEnv.ts";

test("ignores empty key placeholders and comments", () => {
  const values = parseEnvFile(`# Server-side only
GEMINI_API_KEY=
PORT=5000
GEMINI_TEXT_MODEL=gemini-3.8-flash
`);

  assert.equal(values.GEMINI_API_KEY, undefined);
  assert.equal(values.PORT, "5000");
  assert.equal(values.GEMINI_TEXT_MODEL, "gemini-3.8-flash");
});
