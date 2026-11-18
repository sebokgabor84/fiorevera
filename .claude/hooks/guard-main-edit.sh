#!/usr/bin/env bash
# PreToolUse hook for Edit | Write | MultiEdit | NotebookEdit.
# Denies a file write when the target file sits in a checkout of THIS repository that is on `main`.
# Why: Vercel deploys production from every push to `main`, so work on `main` is one commit away
# from a release. Rules: .agent/skills/release-manager/SKILL.md.
#
# Contract (Claude Code hooks): JSON on stdin; a deny is JSON on stdout with
# hookSpecificOutput.permissionDecision = "deny". Exit 0 with no output = normal permission flow
# (this hook never auto-approves anything). Needs bash, git and jq only — no node, so it also runs
# when the app's hook environment has no nvm PATH.
#
# Allowed on main: files outside this repository, git-ignored files (.env.local, dist/, …) and a
# detached HEAD (rebase in progress). Everything else is denied; there is no override here on
# purpose — creating a branch costs one command and keeps the uncommitted changes.

set -u

deny() {
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg r "$1" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi
  echo "$1" >&2
  exit 2 # exit 2 routes the same way as a deny
}

input="$(cat 2>/dev/null || true)"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
own_common="$(git -C "$here" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
[ -z "$own_common" ] && exit 0

if ! command -v jq >/dev/null 2>&1; then
  # Cannot read the tool input. Fail closed only where it matters: the session's checkout is on main.
  dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  b="$(git -C "$dir" symbolic-ref --short -q HEAD 2>/dev/null || true)"
  case "$b" in
    main | master) deny "guard-main-edit: jq is not installed, so the edit guard cannot check the target file, and this checkout is on \`$b\` (production). Create a branch first: git switch -c <prefix>/<short-desc>" ;;
  esac
  exit 0
fi

file="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input" 2>/dev/null || true)"
cwd="$(jq -r '.cwd // empty' <<<"$input" 2>/dev/null || true)"
[ -z "$file" ] && exit 0
case "$file" in
  /*) ;;
  *) file="${cwd:-$PWD}/$file" ;;
esac

# Nearest existing directory (the file or its folders may not exist yet).
dir="$(dirname "$file")"
while [ ! -d "$dir" ] && [ "$dir" != "/" ]; do dir="$(dirname "$dir")"; done

top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$top" ] && exit 0 # not in a git checkout
common="$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
[ "$common" != "$own_common" ] && exit 0 # another repository: not this hook's business

branch="$(git -C "$dir" symbolic-ref --short -q HEAD 2>/dev/null || true)"
case "$branch" in
  main | master) ;;
  *) exit 0 ;;
esac

git -C "$top" check-ignore -q -- "$file" 2>/dev/null && exit 0 # git-ignored: can never be committed

deny "BLOCKED by the branch guard: $file is in a checkout on \`$branch\`, and \`$branch\` is production (Vercel deploys every push to it). Nothing was written. Create a branch first — uncommitted changes travel with you:

  git -C \"$top\" switch -c <feature|fix|chore|docs|content>/<short-desc>

or, when another session is working in that folder, use your own worktree. Then repeat the edit. Do not work around this guard with shell redirection or sed; the commit and the push would be refused as well. Rules: .agent/skills/release-manager/SKILL.md"
