#!/usr/bin/env bash
# SessionEnd hook. Writes a mechanical record of how the session ended (branch, uncommitted
# files, unpushed commits, whether the goodbye ritual touched the handover note) into
# <git common dir>/fv-sessions/<session>.end — never tracked, shared by every worktree.
# session-start.sh shows the record to the next session when that work is still uncommitted.
# No model involved, no output (Claude Code discards SessionEnd output), must finish in ~1 s.

input="$(cat 2>/dev/null || true)"
command -v jq >/dev/null 2>&1 || exit 0
sid="$(jq -r '.session_id // empty' <<<"$input" 2>/dev/null)"
dir="$(jq -r '.cwd // empty' <<<"$input" 2>/dev/null)"
[ -n "$sid" ] || exit 0
[ -d "$dir" ] || dir="${CLAUDE_PROJECT_DIR:-$PWD}"

top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0
state="$(git -C "$top" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/fv-sessions"
mkdir -p "$state" 2>/dev/null || exit 0

goodbye=no
note="$top/.agent/last-session-handover.md"
[ -f "$note" ] && [ -e "$state/$sid.start" ] && [ "$note" -nt "$state/$sid.start" ] && goodbye=yes

{
  echo "ended_at=$(date '+%F %H:%M')"
  echo "top=$top"
  echo "branch=$(git -C "$top" symbolic-ref --short -q HEAD 2>/dev/null || echo detached)"
  echo "uncommitted=$(git -C "$top" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  echo "unpushed=$(git -C "$top" rev-list --count '@{u}..HEAD' 2>/dev/null || echo no-upstream)"
  echo "goodbye=$goodbye"
  echo "reason=$(jq -r '.reason // "other"' <<<"$input" 2>/dev/null)"
} >"$state/$sid.end" 2>/dev/null
exit 0
