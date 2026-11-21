#!/usr/bin/env bash
# SessionStart hook. Prints the release state into the session context so every session boots
# knowing where it stands: branch (and a loud warning on main), dirty state, distance to
# origin/main, open pull requests, whether the git hooks are installed, earlier sessions that
# ended with uncommitted work, and the handover note with its age.
# Read-only, never fetches, never blocks. Needs bash, git, jq and curl. The full report with
# branch and worktree hygiene is `npm run release:status`.

input="$(cat 2>/dev/null || true)"
jqr() { command -v jq >/dev/null 2>&1 && jq -r "$1" <<<"$input" 2>/dev/null || true; }
sid="$(jqr '.session_id // empty')"
src="$(jqr '.source // empty')"
dir="$(jqr '.cwd // empty')"
[ -d "$dir" ] || dir="${CLAUDE_PROJECT_DIR:-$PWD}"

top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0
common="$(git -C "$top" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)"
state="$common/fv-sessions"
mkdir -p "$state" 2>/dev/null
find "$state" -type f -mtime +30 -delete 2>/dev/null
[ -n "$sid" ] && [ ! -e "$state/$sid.start" ] && : >"$state/$sid.start"

branch="$(git -C "$top" symbolic-ref --short -q HEAD 2>/dev/null)"
echo "## Fiore Vera — release state (session-start hook, read-only)"
echo "Checkout: $top"
case "$branch" in
  main | master)
    echo "Branch: $branch  ⛔ THIS IS PRODUCTION. Vercel deploys every push to $branch."
    echo "  Edits, commits and pushes here are blocked. Before any change: git switch -c <feature|fix|chore|docs|content>/<short-desc>"
    ;;
  "") echo "Branch: (detached HEAD at $(git -C "$top" rev-parse --short HEAD 2>/dev/null))" ;;
  *) echo "Branch: $branch" ;;
esac

# Who is at the keyboard today? (scripts/release/operator.ts; a session is good for its day only)
ops="${FV_OPERATORS_FILE:-$HOME/.config/fiorevera/operators.json}"
sess="${FV_SESSION_FILE:-$(dirname "$ops")/session.json}"
if [ -f "$ops" ] && command -v jq >/dev/null 2>&1; then
  who="$(jq -r --arg d "$(date '+%F')" 'select(.day == $d) | "\(.name) (\(.role))"' "$sess" 2>/dev/null)"
  if [ -n "$who" ]; then
    echo "At the keyboard today: $who"
  else
    echo "At the keyboard today: NOT SAID YET. Start of day: before anything else ask who is here"
    echo "  ($(jq -r '[.operators | to_entries[] | .value.name] | join(" or ")' "$ops" 2>/dev/null)?), then run the good-morning routine: npm run content:morning -- --as <id>   (skill: goodmorning)"
  fi
else
  echo "At the keyboard today: nobody is set up on this machine (technical owner, once: npm run release:operator -- --set <id> --role admin --name \"<name>\")"
fi

dirty="$(git -C "$top" status --porcelain 2>/dev/null)"
if [ -n "$dirty" ]; then
  echo "Working tree: $(printf '%s\n' "$dirty" | wc -l | tr -d ' ') changed or untracked file(s)"
  printf '%s\n' "$dirty" | head -8 | sed 's/^/    /'
else
  echo "Working tree: clean"
fi

if git -C "$top" rev-parse -q --verify origin/main >/dev/null 2>&1; then
  set -- $(git -C "$top" rev-list --left-right --count origin/main...HEAD 2>/dev/null)
  # every worktree keeps its own FETCH_HEAD; the remote-tracking refs are shared, so take the newest
  fh="$(ls -t "$common/FETCH_HEAD" "$common"/worktrees/*/FETCH_HEAD 2>/dev/null | head -1)"
  fetched="$(date -r "${fh:-/nonexistent}" '+%F %H:%M' 2>/dev/null || echo unknown)"
  echo "Against origin/main: ${2:-?} commit(s) ahead, ${1:-?} behind (last fetch: $fetched)"
fi
if [ -n "$branch" ]; then
  if git -C "$top" rev-parse -q --verify "@{u}" >/dev/null 2>&1; then
    echo "Not yet pushed: $(git -C "$top" rev-list --count "@{u}..HEAD" 2>/dev/null) commit(s)"
  else
    echo "Upstream: none (this branch is not on origin)"
  fi
fi

slug="$(git -C "$top" remote get-url origin 2>/dev/null | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##')"
if [ -n "$slug" ] && command -v curl >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
  prs="$(curl -s --max-time 4 "https://api.github.com/repos/$slug/pulls?state=open&per_page=20" 2>/dev/null |
    jq -r 'if type == "array" then (if length == 0 then "none" else .[] | "#\(.number) \(.head.ref) → \(.base.ref): \(.title)" end) else "unknown (GitHub: \((.message // "no list") | if test("rate limit"; "i") then "rate limit reached, 60 requests an hour without a login" else . end))" end' 2>/dev/null)"
  echo "Open pull requests: ${prs:-unknown (GitHub not reachable)}" | sed '2,$s/^/    /'
fi

hp="$(git -C "$top" config --get core.hooksPath 2>/dev/null)"
case "$hp" in
  "") echo "Git hooks: ⚠ NOT INSTALLED (core.hooksPath is unset) — run: npm run prepare" ;;
  /*) hd="$hp" ;;
  *) hd="$top/$hp" ;;
esac
if [ -n "$hp" ]; then
  if grep -q 'FV-GUARD' "$hd/pre-push" 2>/dev/null; then
    echo "Git hooks: installed ($hd)"
  else
    echo "Git hooks: ⚠ $hd has no main guard (that checkout is on an older commit) — bring it up to date with main"
  fi
fi

for f in $(ls -t "$state"/*.end 2>/dev/null | head -8); do
  [ "$(basename "$f" .end)" = "$sid" ] && continue
  e_top="$(sed -n 's/^top=//p' "$f")"
  [ -d "$e_top" ] || continue
  [ "$(sed -n 's/^goodbye=//p' "$f")" = "no" ] || continue
  now_dirty="$(git -C "$e_top" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  [ "${now_dirty:-0}" -gt 0 ] || continue
  echo "⚠ Earlier session ended without the goodbye ritual: $now_dirty uncommitted file(s) on \`$(git -C "$e_top" symbolic-ref --short -q HEAD 2>/dev/null)\` in $e_top (ended $(sed -n 's/^ended_at=//p' "$f"))"
done

note="$top/.agent/last-session-handover.md"
if [ -f "$note" ]; then
  n_ct="$(git -C "$top" log -1 --format=%ct -- .agent/last-session-handover.md 2>/dev/null)"
  h_ct="$(git -C "$top" log -1 --format=%ct 2>/dev/null)"
  n_day="$(git -C "$top" log -1 --format=%cs -- .agent/last-session-handover.md 2>/dev/null)"
  lag=$(((${h_ct:-0} - ${n_ct:-0}) / 86400))
  if [ "$lag" -ge 2 ]; then
    echo "Handover note: last committed $n_day — ⚠ STALE, $lag day(s) older than the latest commit here. Trust git and BACKLOG.md over it."
  else
    echo "Handover note: last committed ${n_day:-never}"
  fi
  case "$src" in
    resume | compact) ;;
    *)
      echo "--- .agent/last-session-handover.md (first 30 lines) ---"
      head -30 "$note"
      echo "--- end of excerpt ---"
      ;;
  esac
fi
if [ -f "$top/BACKLOG.md" ] && git -C "$top" rev-parse -q --verify origin/main >/dev/null 2>&1; then
  b_n=0
  for m in $(git -C "$top" rev-list --first-parent --merges -n 30 origin/main 2>/dev/null); do
    git -C "$top" diff --quiet "$m^1" "$m" -- BACKLOG.md 2>/dev/null || break
    b_n=$((b_n + 1))
  done
  b_day="$(git -C "$top" log -1 --format=%cs origin/main -- BACKLOG.md 2>/dev/null)"
  if [ "$b_n" -gt 0 ]; then
    echo "BACKLOG.md: last changed on main ${b_day:-never} — ⚠ $b_n pull request(s) merged since without touching it. Check that their items are closed (npm run release:status, goodbye step 4)."
  else
    echo "BACKLOG.md: last changed on main ${b_day:-never}"
  fi
fi
echo "Release rules: .agent/skills/release-manager/SKILL.md — GO 1 = commit and push the branch, GO 2 = the owner merges the pull request. Close or pause with the goodbye ritual."
exit 0
