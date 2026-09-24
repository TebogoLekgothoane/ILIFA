import assert from "node:assert/strict";
import test from "node:test";
import { encodeAudioForClient, pcmToWav } from "./wav.ts";

test("wraps raw PCM as a WAV file", () => {
  const wav = pcmToWav(Buffer.from([0, 0, 1, 0, 2, 0, 3, 0]));
  assert.equal(wav.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(wav.subarray(8, 12).toString("ascii"), "WAVE");
});

test("passes through existing WAV payloads", () => {
  const wav = pcmToWav(Buffer.from([0, 0, 1, 0]));
  const encoded = encodeAudioForClient(wav.toString("base64"), "audio/wav");
  assert.equal(encoded.audioMimeType, "audio/wav");
  assert.equal(Buffer.from(encoded.audioBase64, "base64").subarray(0, 4).toString("ascii"), "RIFF");
});
