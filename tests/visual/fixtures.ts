/**
 * The visual suite runs the PRODUCTION build, which carries the real form endpoint and access key.
 * No visual test presses submit today; importing `test` from the e2e fixtures keeps it that way by
 * construction: every request to a real form provider is aborted in every test (see tests/e2e/fixtures.ts).
 * Specs and helpers in this folder import from here, never from '@playwright/test' (ESLint enforces it).
 */
export { test, expect } from '../e2e/fixtures';
