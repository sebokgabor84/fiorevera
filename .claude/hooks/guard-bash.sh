#!/usr/bin/env bash
# PreToolUse hook for Bash. Denies the shell routes that would step around the release guardrails:
#   1. FV_SKIP_HOOKS=1 together with a git commit / push / merge …   (skips every git hook)
#   2. --no-verify (and `git commit -n`)                              (skips the git hooks)
#   3. changing core.hooksPath                                        (unplugs the git hooks)
#   4. a push whose target is main (also --all / --mirror / delete)   (main = production)
#   5. a plain force push (--force, -f, +refspec); --force-with-lease is allowed, because a
#      rebased branch needs it
#   6. `git merge <branch>` while on main (only origin/main may be merged, fast-forward), and
#      merging main INTO a feature branch (hard rule: rebase onto origin/main instead)
#   7. vercel --prod / promote / rollback / alias                     (changes production directly)
#   8. gh pr merge / gh api …/merge                                   (merging a pull request = release;
#                                                                      the content lane script is the one door)
# These stay possible for the OWNER in his own terminal; an agent never runs them.
# Rules: .agent/skills/release-manager/SKILL.md ("When a hook blocks").
#
# This is a tripwire, not a wall: quoted text and heredoc bodies are ignored (so a commit message
# may mention any of the above), which also means `sh -c '…'` is not inspected. The walls are the
# git hooks in .githooks/ and the GitHub ruleset on main.
#
# Contract: JSON on stdin; deny = JSON on stdout; exit 0 with no output = normal permission flow.

set -u
command -v jq >/dev/null 2>&1 || exit 0 # the git hooks still stand behind this

input="$(cat 2>/dev/null || true)"
[ "$(jq -r '.tool_name // empty' <<<"$input" 2>/dev/null)" = "Bash" ] || exit 0
cwd="$(jq -r '.cwd // empty' <<<"$input" 2>/dev/null || true)"

deny() {
  jq -n --arg r "BLOCKED by the release guard: $1

Nothing was run. Do not rephrase the command to get past this. Tell the owner what you wanted to do and why; if it is really needed he runs it in his own terminal. Rules: .agent/skills/release-manager/SKILL.md" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

# Command text without heredoc bodies and quoted strings, one shell segment per line.
segments="$(jq -r '
  (.tool_input.command // "")
  | gsub("(?s)<<-?\\s*[\"\\x27]?(?<t>[A-Za-z_][A-Za-z0-9_]*)[\"\\x27]?.*?\\n\\s*\\k<t>(?=\\s|$)"; " ")
  | gsub("\\x27[^\\x27]*\\x27"; " Q ")
  | gsub("\"[^\"]*\""; " Q ")
  | gsub("\\\\\\n"; " ")
  | [splits("&&|\\|\\||[;|\\n&()]")] | .[]' <<<"$input" 2>/dev/null || true)"
[ -z "$segments" ] && exit 0

skip_env=0
grep -Eq '(^|[[:space:]])(export[[:space:]]+)?FV_SKIP_HOOKS=([^0[:space:]]|[[:space:]]+Q([[:space:]]|$))' <<<"$segments" && skip_env=1
hook_git=0 # a git command that runs hooks appears somewhere in the command

while IFS= read -r seg; do
  read -r -a w <<<"$seg" || true
  n=${#w[@]}
  [ "$n" -eq 0 ] && continue

  # --- vercel CLI -------------------------------------------------------------------------------
  for ((i = 0; i < n; i++)); do
    case "${w[i]}" in
      vercel | */vercel | vercel@*)
        rest=" ${w[*]:i+1} "
        case "$rest" in
          *" --prod "* | *" --prod="* | *" --target production "* | *" --target=production "* | *" promote "* | *" rollback "* | *" alias "*)
            deny "this vercel command changes the production deployment directly, bypassing git, the pull request and both GO gates. A release happens by merging a pull request into main; a rollback is the owner's click in the Vercel dashboard (Instant Rollback)."
            ;;
        esac
        ;;
    esac
  done

  # --- GitHub CLI: merging a pull request IS the release --------------------------------------
  for ((i = 0; i < n; i++)); do
    case "${w[i]}" in
      gh | */gh)
        rest=" ${w[*]:i+1} "
        case "$rest" in
          *" pr merge "* | *" api "*"/merge "* | *" api "*"/merges "*)
            deny "merging a pull request puts the change live on fiorevera.hu, and an agent never merges by typing gh. Code and anything outside the content catalogue: the owner merges on GitHub (GO 2). Pure catalogue content, after the owner's yes on the review page: npm run release:publish-content — the one script that checks the change class, the gates for exactly this state and the recorded approval before it merges."
            ;;
        esac
        ;;
    esac
  done

  # --- git: find the subcommand -----------------------------------------------------------------
  gi=-1
  for ((i = 0; i < n; i++)); do
    case "${w[i]}" in git | */git) gi=$i && break ;; esac
  done
  [ "$gi" -lt 0 ] && continue
  sub="" si=-1 i=$((gi + 1))
  while [ "$i" -lt "$n" ]; do
    t="${w[i]}"
    case "$t" in
      -c)
        shopt -s nocasematch
        case "${w[i + 1]:-}" in core.hookspath=*) shopt -u nocasematch && deny "\`git -c core.hooksPath=…\` unplugs the git hooks (the commit-on-main and push-to-main refusals and the quality gates) for this command." ;; esac
        shopt -u nocasematch
        i=$((i + 2))
        ;;
      -C | --git-dir | --work-tree | --namespace) i=$((i + 2)) ;;
      -*) i=$((i + 1)) ;;
      *) sub="$t" si=$i && break ;;
    esac
  done
  [ -z "$sub" ] && continue
  args=("${w[@]:si+1}")
  rest=" ${args[*]:-} "

  case "$sub" in commit | push | merge | pull | rebase | cherry-pick | revert | am) hook_git=1 ;; esac

  # 2. --no-verify
  case "$sub" in
    commit | push | merge | pull | rebase | cherry-pick | revert | am)
      case "$rest" in *" --no-verify "*) deny "\`--no-verify\` skips the git hooks: the refusal to commit on main and the lint, unit, build and visual gates. Fix what the hook reports instead." ;; esac
      ;;
  esac
  if [ "$sub" = "commit" ]; then
    for t in "${args[@]:-}"; do
      case "$t" in --*) ;; -*n*) deny "\`git commit $t\` contains -n (= --no-verify), which skips the git hooks." ;; esac
    done
  fi

  # 3. core.hooksPath
  if [ "$sub" = "config" ]; then
    shopt -s nocasematch
    case "$rest" in
      *core.hookspath*)
        case "$rest" in
          *" --unset"* | *" --replace-all "* | *" --add "*) shopt -u nocasematch && deny "this changes core.hooksPath and would unplug the git hooks. \`npm run prepare\` is the only thing that sets it." ;;
          *" --get"* | *" --show-origin "* | *" --list "* | *" -l "*) ;;
          *core.hookspath" "[!-\ ]*) shopt -u nocasematch && deny "this changes core.hooksPath and would unplug the git hooks. \`npm run prepare\` is the only thing that sets it." ;;
        esac
        ;;
    esac
    shopt -u nocasematch
  fi

  # 4 + 5. push
  if [ "$sub" = "push" ]; then
    for t in "${args[@]:-}"; do
      case "$t" in
        --all | --mirror) deny "\`git push $t\` would also push main. Push only your own branch: git push -u origin <branch>" ;;
        --force) deny "a plain --force overwrites whatever is on origin. After a rebase onto origin/main use: git push --force-with-lease origin <branch> — and first check that the pull request is still open (2026-11-16: a force push landed on a branch the owner was merging)." ;;
        --*) ;;
        -*f*) deny "\`git push $t\` contains -f (plain force push). After a rebase onto origin/main use: git push --force-with-lease origin <branch>" ;;
        -*) ;;
        +*) deny "the refspec \`$t\` is a plain force push. After a rebase onto origin/main use: git push --force-with-lease origin <branch>" ;;
        main | master | refs/heads/main | refs/heads/master | *:main | *:master | *:refs/heads/main | *:refs/heads/master)
          deny "this push targets main, and main is production (Vercel deploys every push to it). The only way onto main is a pull request the owner merges on GitHub (GO 2). Push your branch instead: git push -u origin <branch>"
          ;;
      esac
    done
  fi

  # 6. merge while on main
  if [ "$sub" = "merge" ]; then
    b="$(git -C "${cwd:-$PWD}" symbolic-ref --short -q HEAD 2>/dev/null || true)"
    case "$b" in
      main | master)
        case "$rest" in
          *" --abort "* | *" --quit "* | *" origin/main "* | *" origin/master "* | *" @{u} "* | *" @{upstream} "* | *" FETCH_HEAD "*) ;;
          *) deny "this merges into the local \`$b\`. Work reaches main only through a pull request merged on GitHub. To update the local main: git merge --ff-only origin/main" ;;
        esac
        ;;
      *)
        case "$rest" in
          *" --abort "* | *" --quit "* | *" --continue "*) ;;
          *" main "* | *" master "* | *" origin/main "* | *" origin/master "*)
            deny "hard rule (owner, 2026-11-18): a feature branch is never merged with main. Bring \`$b\` up to date with: git fetch && git rebase origin/main — and push an already pushed branch with: git push --force-with-lease origin $b"
            ;;
        esac
        ;;
    esac
  fi

  # 6b. `git pull … main` on a feature branch is a merge of main unless it rebases
  if [ "$sub" = "pull" ]; then
    b="$(git -C "${cwd:-$PWD}" symbolic-ref --short -q HEAD 2>/dev/null || true)"
    case "$b" in
      main | master | "") ;;
      *)
        case "$rest" in
          *" --rebase "* | *" --rebase="* | *" -r "*) ;;
          *" main "* | *" master "*)
            deny "hard rule (owner, 2026-11-18): this pull would merge main into \`$b\`. Use: git fetch && git rebase origin/main"
            ;;
        esac
        ;;
    esac
  fi
done <<<"$segments"

# 1. FV_SKIP_HOOKS
if [ "$skip_env" = 1 ] && [ "$hook_git" = 1 ]; then
  deny "FV_SKIP_HOOKS=1 switches off every git hook: the refusal to commit on or push to main and the lint, unit, build and visual gates. It is the owner's emergency switch for his own terminal and must be recorded in the pull request."
fi
exit 0
