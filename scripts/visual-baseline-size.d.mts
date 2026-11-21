/** Types for scripts/visual-baseline-size.mjs (plain .mjs because scripts/visual-approve.mjs imports it under bare node). */
export interface BaselineSet {
  files: number;
  bytes: number;
}
export interface BaselineHistory {
  versions: number;
  bytes: number;
}
export const BASELINE_DIR: string;
export const SET_BUDGET: number;
export const HISTORY_BUDGET: number;
export const WARN_SHARE: number;
export function baselineSet(root?: string): BaselineSet;
export function baselineHistory(root?: string): BaselineHistory | null;
export function mb(bytes: number): string;
export function sizeReport(input: { set: BaselineSet; history: BaselineHistory | null; before?: BaselineSet }): string[];
export function healthy(set: BaselineSet, history: BaselineHistory | null): boolean;
