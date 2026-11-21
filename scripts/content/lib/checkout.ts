/**
 * scripts/content/lib/checkout.ts — small git facts the content scripts share.
 * git is called directly (no shell), so a shell hook that rewrites output cannot touch what is read.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The variables with which git points a child process at ONE repository (`git rev-parse
 * --local-env-vars`). Inside a git hook they are set to the repository that runs the hook, and any
 * git command a script starts would follow them instead of its own working directory: on
 * 2026-11-21 a test that ran `git init` in a temporary folder during the pre-push hook
 * re-initialised the real repository as bare. Every git call of these scripts names its
 * repository by `cwd`, so these variables are always removed.
 */
const REPOSITORY_ENV = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_CONFIG',
  'GIT_CONFIG_PARAMETERS',
  'GIT_CONFIG_COUNT',
  'GIT_OBJECT_DIRECTORY',
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_IMPLICIT_WORK_TREE',
  'GIT_GRAFT_FILE',
  'GIT_INDEX_FILE',
  'GIT_NO_REPLACE_OBJECTS',
  'GIT_REPLACE_REF_BASE',
  'GIT_PREFIX',
  'GIT_SHALLOW_FILE',
  'GIT_COMMON_DIR',
];

/** The environment for a child process that must act on the repository at its `cwd` and on no other. */
export const repoEnv = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  for (const name of REPOSITORY_ENV) delete env[name];
  return env;
};

export const git = (root: string, args: string[]): string =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], env: repoEnv() }).replace(/\s+$/, '');

/** A file exactly as git stores it (no trimming): for comparing content with the working tree. */
export const gitFile = (root: string, ref: string, file: string): string | null => {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], env: repoEnv() });
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
