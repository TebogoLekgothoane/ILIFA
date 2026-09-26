/** Client-side PCM helpers for Gemini Live (16 kHz in, 24 kHz out). */

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Downsample or upsample int16 PCM to a target sample rate with linear interpolation. */
export function resampleInt16Pcm(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Int16Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const src = i * ratio;
    const idx = Math.floor(src);
    const frac = src - idx;
    const a = input[idx] ?? 0;
    const b = input[Math.min(idx + 1, input.length - 1)] ?? a;
    output[i] = Math.max(-32768, Math.min(32767, Math.round(a + (b - a) * frac)));
  }
  return output;
}

export function float32ToInt16Pcm(floatBuffer: ArrayBuffer): Int16Array {
  const floats = new Float32Array(floatBuffer);
  const output = new Int16Array(floats.length);
  for (let i = 0; i < floats.length; i += 1) {
    const s = Math.max(-1, Math.min(1, floats[i] ?? 0));
    output[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
  }
  return output;
}

export function int16BufferToBase64(samples: Int16Array): string {
  const copy = new Uint8Array(samples.byteLength);
  copy.set(new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength));
  return arrayBufferToBase64(copy.buffer);
}

export function pcmBase64ByteLength(base64: string): number {
  const trimmed = base64.trim();
  if (!trimmed) return 0;
  const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((trimmed.length * 3) / 4) - padding);
}

export function pcmBase64DurationMs(base64: string, sampleRate = 24000, channels = 1, bitDepth = 16): number {
  const bytes = pcmBase64ByteLength(base64);
  const bytesPerSecond = (sampleRate * channels * bitDepth) / 8;
  if (bytesPerSecond <= 0) return 0;
  return (bytes / bytesPerSecond) * 1000;
}

export function concatBase64Pcm(chunks: string[]): string {
  const parts = chunks.map((chunk) => base64ToUint8Array(chunk)).filter((part) => part.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) return chunks[0] ?? '';
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return arrayBufferToBase64(merged.buffer);
}

export function pcmChunksToWavBase64(chunks: string[], sampleRate = 24000): string {
  const pcm = concatBase64Pcm(chunks);
  if (!pcm) return '';
  return pcmToWavBase64(pcm, sampleRate);
}

export function pcmToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16,
): string {
  const pcm = base64ToUint8Array(pcmBase64);
  const blockAlign = (channels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm.length, true);

  const wav = new Uint8Array(44 + pcm.length);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcm, 44);
  return arrayBufferToBase64(wav.buffer);
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
