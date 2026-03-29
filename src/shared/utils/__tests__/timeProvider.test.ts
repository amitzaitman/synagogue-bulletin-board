import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('timeProvider', () => {
  const ORIGINAL_DATE_NOW = Date.now;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    Date.now = ORIGINAL_DATE_NOW;
  });

  it('reuses the last trusted time when the device boots with an older clock', async () => {
    const trustedTimeMs = Date.UTC(2026, 2, 29, 10, 0, 0, 0);
    localStorage.setItem('trustedTimeAnchor', JSON.stringify({
      trustedTimeMs,
      deviceTimeMs: trustedTimeMs,
    }));

    Date.now = vi.fn(() => Date.UTC(2020, 0, 1, 0, 0, 0, 0));

    const { getCurrentTime } = await import('../timeProvider');

    expect(getCurrentTime().getTime()).toBe(trustedTimeMs);
  });

  it('marks obviously old clocks as implausible when no trusted time exists', async () => {
    Date.now = vi.fn(() => Date.UTC(2020, 0, 1, 0, 0, 0, 0));

    const { isCurrentClockPlausible } = await import('../timeProvider');

    expect(isCurrentClockPlausible()).toBe(false);
  });
});
