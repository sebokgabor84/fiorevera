import { inject } from '@vercel/analytics';

/**
 * Vercel Web Analytics (PRD D-10, launch plan D5): cookieless page-view counting, free on Hobby.
 * `inject()` appends the tracking script to <head>; it must run once, on the client only (D-18:
 * nothing in a render path). It is started only on the hosts Vercel serves, so the dev server,
 * `vite preview`, Playwright and the visual suite never load a script or send a beacon.
 */
export const ANALYTICS_HOSTS: readonly string[] = ['fiorevera.hu', 'www.fiorevera.hu'];

/** Vercel preview deployments live under this suffix; counting them keeps the first preview verifiable. */
const VERCEL_PREVIEW_SUFFIX = '.vercel.app';

export const isAnalyticsHost = (hostname: string): boolean =>
  ANALYTICS_HOSTS.includes(hostname) || hostname.endsWith(VERCEL_PREVIEW_SUFFIX);

type Inject = typeof inject;

/** Starts analytics when `hostname` is a served host; returns whether it did. `doInject` is injectable for tests. */
export const startAnalytics = (hostname: string, doInject: Inject = inject): boolean => {
  if (!isAnalyticsHost(hostname)) return false;
  doInject({ mode: 'production' });
  return true;
};
