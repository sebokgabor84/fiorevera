// @vitest-environment node
/**
 * The pixel baselines live in the repository (owner decision 2026-11-18,
 * docs/decisions/0003-pixel-baselines-in-the-repository.md), and every approved content change adds
 * pictures to its history. This test is the standing reminder: it fails when the committed set
 * leaves its budget. `npm run visual:size` prints the numbers; `npm run test:visual:update` prints
 * them after every re-record.
 */
import { describe, expect, it } from 'vitest';
import { HISTORY_BUDGET, SET_BUDGET, baselineHistory, baselineSet, healthy, mb, sizeReport } from '../../scripts/visual-baseline-size.mjs';

describe('pixel baselines: size and health', () => {
  const set = baselineSet();

  it(`the committed set stays within its budget (${mb(SET_BUDGET)})`, () => {
    expect(set.files).toBeGreaterThan(0);
    expect(set.bytes, `the baselines weigh ${mb(set.bytes)}: time for the clean-up in BACKLOG.md (baseline maintenance)`).toBeLessThanOrEqual(SET_BUDGET);
  });

  it('the report says how full both budgets are and what a re-record changed', () => {
    const lines = sizeReport({ set: { files: 27, bytes: 9 * 1024 * 1024 }, history: { versions: 50, bytes: 19 * 1024 * 1024 }, before: { files: 27, bytes: 8.5 * 1024 * 1024 } });
    expect(lines[0]).toBe('baselines: 27 pictures, 9.0 MB of 15.0 MB (60 %) — healthy; this re-record changed the set by +0.5 MB');
    expect(lines[1]).toMatch(/^baselines in git history: 50 versions, 19\.0 MB of 100\.0 MB \(19 %\) — healthy/);
    expect(lines).toHaveLength(2);
  });

  it('warns before a budget is reached and names the clean-up when it is passed', () => {
    const full = sizeReport({ set: { files: 40, bytes: 12 * 1024 * 1024 }, history: { versions: 400, bytes: 120 * 1024 * 1024 } });
    expect(full[0]).toMatch(/getting full/);
    expect(full[1]).toMatch(/OVER BUDGET/);
    expect(full[2]).toMatch(/clean-up \(BACKLOG: baseline maintenance/);
    expect(healthy({ files: 40, bytes: 12 * 1024 * 1024 }, { versions: 400, bytes: 120 * 1024 * 1024 })).toBe(false);
    expect(healthy({ files: 27, bytes: 9 * 1024 * 1024 }, null)).toBe(true);
    expect(HISTORY_BUDGET).toBeGreaterThan(SET_BUDGET);
  });

  it('reads the history of the baselines from git', () => {
    const history = baselineHistory();
    if (history === null) return; // not a git checkout (an exported tarball)
    expect(history.versions).toBeGreaterThanOrEqual(set.files);
    expect(history.bytes).toBeGreaterThanOrEqual(set.bytes);
  });
});
