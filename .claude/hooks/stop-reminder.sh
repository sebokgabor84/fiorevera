#!/usr/bin/env bash
# Stop hook. When the working tree is dirty and the goodbye ritual has not run in this session
# (the handover note is older than the session), it gives Claude one reminder so a "we pause"
# does not end the session with unrecorded work (2026-11-16: the handover note was a week stale).
# Throttle: first reminder after 20 minutes of session, then at most once an hour.
# It never blocks: the reminder is hook feedback, not an error. Kill switch: FV_STOP_REMINDER=0.

[ "${FV_STOP_REMINDER:-1}" = "0" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0
input="$(cat 2>/dev/null || true)"
[ "$(jq -r '.stop_hook_active // false' <<<"$input" 2>/dev/null)" = "true" ] && exit 0
sid="$(jq -r '.session_id // empty' <<<"$input" 2>/dev/null)"
dir="$(jq -r '.cwd // empty' <<<"$input" 2>/dev/null)"
[ -n "$sid" ] || exit 0
[ -d "$dir" ] || dir="${CLAUDE_PROJECT_DIR:-$PWD}"

top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0
state="$(git -C "$top" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/fv-sessions"
mkdir -p "$state" 2>/dev/null || exit 0
start="$state/$sid.start"
[ -e "$start" ] || { : >"$start"; exit 0; } # session began before the hooks existed: start the clock now

changed="$(git -C "$top" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
[ "${changed:-0}" -gt 0 ] || exit 0
note="$top/.agent/last-session-handover.md"
[ -f "$note" ] && [ "$note" -nt "$start" ] && exit 0 # goodbye wrote the handover note in this session

mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0; }
now="$(date +%s)"
[ $((now - $(mtime "$start"))) -ge 1200 ] || exit 0
last="$state/$sid.reminded"
[ -e "$last" ] && [ $((now - $(mtime "$last"))) -lt 3600 ] && exit 0
: >"$last"

branch="$(git -C "$top" symbolic-ref --short -q HEAD 2>/dev/null || echo detached)"
jq -n --arg m "Release-guard reminder (stop-reminder.sh, at most once an hour): $changed uncommitted file(s) on \`$branch\` and the goodbye ritual has not run in this session. If the owner is pausing or ending here, tell him so in one line and offer to run \`goodbye\` (.agent/skills/goodbye/SKILL.md). If the work simply continues, add nothing and change nothing because of this reminder." \
  '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:$m}}'
exit 0
