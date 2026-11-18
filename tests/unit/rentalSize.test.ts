import { describe, it, expect } from 'vitest';
import { formatSize } from '../../src/lib/rentalSize';
import { rentalItems } from '../../src/data/rentalItems';

describe('formatSize (rental cards)', () => {
  it('keeps the decimal comma in HU and DE and uses a point in EN', () => {
    expect(formatSize('2,8 m × 2,5 m', 'hu')).toBe('2,8\u00a0m × 2,5\u00a0m');
    expect(formatSize('2,8 m × 2,5 m', 'de')).toBe('2,8\u00a0m × 2,5\u00a0m');
    expect(formatSize('2,8 m × 2,5 m', 'en')).toBe('2.8\u00a0m × 2.5\u00a0m');
  });

  it('binds the unit to its number and leaves list separators alone', () => {
    expect(formatSize('28 / 23 / 17 cm', 'en')).toBe('28 / 23 / 17\u00a0cm');
    expect(formatSize('170 cm × 60 cm', 'hu')).toBe('170\u00a0cm × 60\u00a0cm');
  });

  it('leaves no decimal comma on any English rental size', () => {
    for (const item of rentalItems) if (item.size) expect(formatSize(item.size, 'en')).not.toMatch(/\d,\d/);
  });
});
