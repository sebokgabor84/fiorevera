import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_HOSTS, isAnalyticsHost, startAnalytics } from '../../src/lib/analytics';

describe('Vercel Web Analytics gating (launch plan D5)', () => {
  it('counts only the served hosts and Vercel previews', () => {
    expect(ANALYTICS_HOSTS).toEqual(['fiorevera.hu', 'www.fiorevera.hu']);
    for (const host of ['www.fiorevera.hu', 'fiorevera.hu', 'fiorevera-abc123-gabor.vercel.app']) {
      expect(isAnalyticsHost(host), host).toBe(true);
    }
    for (const host of ['localhost', '127.0.0.1', 'www.fiorevera.hu.evil.example', 'vercel.app', 'webnode.hu']) {
      expect(isAnalyticsHost(host), host).toBe(false);
    }
  });

  it('injects the production script once on a served host', () => {
    const doInject = vi.fn();
    expect(startAnalytics('www.fiorevera.hu', doInject)).toBe(true);
    expect(doInject).toHaveBeenCalledTimes(1);
    expect(doInject).toHaveBeenCalledWith({ mode: 'production' });
  });

  it('never injects on the dev server, vite preview or the test runners', () => {
    const doInject = vi.fn();
    expect(startAnalytics('localhost', doInject)).toBe(false);
    expect(startAnalytics('127.0.0.1', doInject)).toBe(false);
    expect(doInject).not.toHaveBeenCalled();
  });
});

describe('real inject() under jsdom', () => {
  it('appends the same-origin production script once on www.fiorevera.hu', () => {
    document.head.querySelectorAll('script').forEach((s) => s.remove());
    expect(startAnalytics('www.fiorevera.hu')).toBe(true);
    const scripts = Array.from(document.head.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'));
    expect(scripts).toEqual(['/_vercel/insights/script.js']);
  });
});
