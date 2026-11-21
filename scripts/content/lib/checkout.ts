/**
 * scripts/content/lib/checkout.ts — small git facts the content scripts share.
 * git is called directly (no shell), so a shell hook that rewrites output cannot touch what is read.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const git = (root: string, args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\s+$/, '');

/** A file exactly as git stores it (no trimming): for comparing content with the working tree. */
export const gitFile = (root: string, ref: string, file: string): string | null => {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null; // the file did not exist at that commit
  }
};

export const tryGit = (root: string, args: string[]): string | null => {
  try {
    return git(root, args);
  } catch {
    return null;
  }
};

/**
 * Files that an approval or a release adds AFTER the gates ran: the re-recorded comparison pictures
 * and their log, the change log, the committed review spec. They do not alter what was tested, so
 * they are left out of the fingerprint below.
 */
export const AFTER_GATES = [/^tests\/visual\/__screenshots__\//, /^docs\/qa\/visual-baselines-log\.md$/, /^docs\/vera-agent\/changelog\.md$/, /^docs\/qa\/reviews\//];

/**
 * A fingerprint of the checkout's content relative to `base`: which files differ and what they
 * hold now. Two calls agree exactly when nothing that the gates test has changed in between,
 * whether or not the change has been committed meanwhile.
 */
export function workFingerprint(root: string, base: string): string {
  const changed = [
    ...git(root, ['diff', '--name-only', '--no-renames', base]).split('\n'),
    ...git(root, ['ls-files', '--others', '--exclude-standard']).split('\n'),
  ]
    .filter(Boolean)
    .filter((file) => !AFTER_GATES.some((pattern) => pattern.test(file)))
    .sort();
  const hash = createHash('sha256').update(base);
  for (const file of [...new Set(changed)]) {
    const full = path.join(root, file);
    hash.update(`\n${file}:`).update(existsSync(full) ? readFileSync(full) : 'deleted');
  }
  return hash.digest('hex').slice(0, 16);
}

export const mergeBase = (root: string, ref = 'origin/main'): string => git(root, ['merge-base', ref, 'HEAD']);
