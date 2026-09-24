import { periodForYear } from '@/lib/ilifa';

describe('Ilifa client helpers', () => {
  it('maps experience years to heritage periods', () => {
    expect(periodForYear(1920)).toBe('early_1900s');
    expect(periodForYear(1950)).toBe('1950s');
    expect(periodForYear(2026)).toBe('present');
  });
});
