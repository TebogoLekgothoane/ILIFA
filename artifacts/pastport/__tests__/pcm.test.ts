import { concatBase64Pcm, pcmBase64DurationMs, pcmChunksToWavBase64 } from '@/lib/pcm';

function bytesToBase64(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

describe('pcm helpers', () => {
  it('estimates duration from 24 kHz 16-bit mono PCM', () => {
    const pcm = bytesToBase64(new Array(4800).fill(0));
    expect(Math.round(pcmBase64DurationMs(pcm, 24000))).toBe(100);
  });

  it('concatenates PCM chunks and wraps them as one WAV', () => {
    const a = bytesToBase64([1, 2]);
    const b = bytesToBase64([3, 4]);
    expect(concatBase64Pcm([a, b])).toBe(bytesToBase64([1, 2, 3, 4]));
    expect(pcmChunksToWavBase64([a, b], 24000).length).toBeGreaterThan(a.length);
  });
});
