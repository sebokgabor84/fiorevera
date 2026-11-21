#!/usr/bin/env bash
# Release-guard self-test: replays the dangerous moves against THIS checkout's hooks inside a
# throw-away repository (own bare "origin", stub npm gates) and prints what each guard answered.
# Run after any change to .claude/hooks/ or .githooks/:   npm run release:selftest
# It touches nothing outside its temp folder. Exit 1 when a guard did not behave as expected.
# Add -v to print every refusal text, not only the first line.

set -u
verbose=0
[ "${1:-}" = "-v" ] && verbose=1
src="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/fv-release-selftest.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
pass=0
fail=0

ok() { pass=$((pass + 1)); printf '  PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf '  FAIL  %s\n' "$1"; }
show() { # print the guard's own words
  if [ "$verbose" = 1 ]; then printf '%s\n' "$1" | sed 's/^/        | /'; else printf '%s\n' "$1" | grep -m1 -E 'REFUSED|BLOCKED|gates skipped' | cut -c1-150 | sed 's/^/        | /'; fi
}

# --- scratch repository ---------------------------------------------------------------------------
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
unset FV_SKIP_HOOKS
git init -q --bare "$tmp/origin.git"
git init -q -b main "$tmp/repo"
cd "$tmp/repo" || exit 1
git config user.name selftest && git config user.email selftest@example.invalid
git remote add origin "$tmp/origin.git"
mkdir -p .claude/hooks .githooks
cp "$src"/.claude/hooks/*.sh .claude/hooks/
cp "$src"/.githooks/* .githooks/
cat >package.json <<'JSON'
{ "name": "fv-selftest", "private": true, "scripts": {
  "lint": "echo GATE-lint", "test": "sh -c 'echo GATE-unit'",
  "build": "echo GATE-build", "test:visual": "echo GATE-visual" } }
JSON
printf 'secret.local\n' >.gitignore
echo one >page.txt
git add -A && git commit -q -m "seed" # hooks not installed yet: the seed commit lands on main
git push -q origin main
git config core.hooksPath .githooks

edit_guard() { jq -n --arg f "$1" --arg c "$tmp/repo" '{tool_name:"Edit",cwd:$c,tool_input:{file_path:$f}}' | .claude/hooks/guard-main-edit.sh; }
bash_guard() { jq -n --arg cmd "$1" --arg c "$tmp/repo" '{tool_name:"Bash",cwd:$c,tool_input:{command:$cmd}}' | .claude/hooks/guard-bash.sh; }
expect_deny() { # label, output
  if printf '%s' "$2" | grep -q '"permissionDecision": *"deny"'; then ok "$1"; show "$(printf '%s' "$2" | jq -r '.hookSpecificOutput.permissionDecisionReason')"; else bad "$1 — expected a deny, got: ${2:-<no output>}"; fi
}
expect_quiet() { if [ -z "$2" ]; then ok "$1"; else bad "$1 — expected no objection, got: $2"; fi; }
expect_refused() { # label, exit code, output
  if [ "$2" -ne 0 ] && printf '%s' "$3" | grep -q 'REFUSED'; then ok "$1"; show "$3"; else bad "$1 — expected a refusal, exit=$2: $3"; fi
}

echo "1. Claude edit guard (.claude/hooks/guard-main-edit.sh)"
expect_deny "Edit of a tracked file on main is denied" "$(edit_guard "$tmp/repo/page.txt")"
expect_deny "Write of a NEW file in a new folder on main is denied" "$(edit_guard "$tmp/repo/src/new/thing.ts")"
expect_quiet "git-ignored file on main is left alone" "$(edit_guard "$tmp/repo/secret.local")"
expect_quiet "file outside the repository is left alone" "$(edit_guard "$tmp/elsewhere.txt")"

echo "2. Git hooks on main (.githooks/)"
echo two >>page.txt && git add page.txt
out="$(git commit -m "direct commit on main" 2>&1)"; expect_refused "git commit on main is refused" $? "$out"
git reset -q --hard # drop the refused change
out2="$(FV_SKIP_HOOKS=1 git commit -q --allow-empty -m "owner emergency" 2>&1)"; c2=$?
[ "$c2" -eq 0 ] && ok "FV_SKIP_HOOKS=1 still lets the owner commit on main (emergency switch)" || bad "FV_SKIP_HOOKS=1 commit failed: $out2"
out="$(git push origin main 2>&1)"; expect_refused "git push origin main is refused" $? "$out"
out="$(git push origin :main 2>&1)"; expect_refused "deleting main on origin is refused" $? "$out"
git reset -q --hard origin/main

echo "3. The same moves on a feature branch"
git switch -q -c feature/selftest
expect_quiet "Edit on a feature branch is left alone" "$(edit_guard "$tmp/repo/page.txt")"
echo three >>page.txt && git add page.txt
out="$(git commit -m "work on a branch" 2>&1)" && ok "git commit on a feature branch works" || bad "commit on a branch failed: $out"
out="$(git push origin HEAD:main 2>&1)"; expect_refused "git push origin HEAD:main from a branch is refused" $? "$out"
out="$(git push -u origin feature/selftest 2>&1)"; code=$?
gates="$(printf '%s\n' "$out" | grep -E '^GATE-[a-z]+$' | tr '\n' ' ')" # npm also echoes the script line
if [ "$code" -eq 0 ] && [ "$gates" = "GATE-lint GATE-unit GATE-build GATE-visual " ]; then ok "push of a branch runs the gates in order: $gates"; else bad "branch push: exit=$code gates='$gates'"; fi
out="$(git push origin --delete feature/selftest 2>&1)"; code=$?
if [ "$code" -eq 0 ] && printf '%s' "$out" | grep -q 'gates skipped' && ! printf '%s' "$out" | grep -q 'GATE-'; then ok "a push that only deletes a branch skips the gates"; show "$out"; else bad "delete push: exit=$code: $out"; fi

echo "4. Merge commit on main (.githooks/pre-merge-commit)"
git switch -q main
echo other >other.txt && git add other.txt && FV_SKIP_HOOKS=1 git commit -q -m "diverge (test setup)"
out="$(git merge --no-edit feature/selftest 2>&1)"; expect_refused "a merge commit on main is refused" $? "$out"
git merge --abort 2>/dev/null
git reset -q --hard origin/main

echo "5. Claude Bash guard (.claude/hooks/guard-bash.sh), while on main"
while IFS='|' read -r want cmd; do
  [ -z "$want" ] && continue
  res="$(bash_guard "$cmd")"
  if [ "$want" = "deny" ]; then expect_deny "denied:  $cmd" "$res"; else expect_quiet "allowed: $cmd" "$res"; fi
done <<'CASES'
deny|git push origin main
deny|rtk git push origin HEAD:main
deny|git push origin feature/x:refs/heads/main
deny|git push origin --delete main
deny|git push --all origin
deny|git push --force origin feature/x
deny|git push --force-with-lease origin main
deny|git push -f origin feature/x
deny|git push origin +feature/x
deny|git commit --no-verify -m "quick fix"
deny|git commit -nm "quick fix"
deny|FV_SKIP_HOOKS=1 git push origin feature/x
deny|export FV_SKIP_HOOKS=1 && git commit -m x
deny|git -c core.hooksPath=/dev/null commit -m x
deny|git config core.hooksPath /tmp/none
deny|git config --unset core.hooksPath
deny|git merge feature/x
deny|cd /tmp && npx vercel --prod
deny|vercel promote https://example.vercel.app
deny|vercel rollback
deny|gh pr merge 12 --merge
deny|gh pr merge content/2027-01-10-new-album --merge --delete-branch
deny|gh api -X PUT repos/o/r/pulls/12/merge
allow|gh pr view 12 --json state
allow|gh pr create --base main --head feature/x --title x --body y
allow|npm run release:publish-content -- --what "ár" --approved-by Vera
allow|git push -u origin feature/x
allow|git push --force-with-lease origin feature/x
allow|git push origin --delete feature/x
allow|git push -u origin feature/main-menu
allow|git commit -m "docs: never push to main with --no-verify or FV_SKIP_HOOKS=1"
allow|git commit --amend --no-edit
allow|git config --get core.hooksPath
allow|git config core.hooksPath
allow|git merge --ff-only origin/main
allow|grep -rn "FV_SKIP_HOOKS=1" .githooks
allow|git log --oneline -5 main
allow|git diff main...HEAD
allow|vercel --version
allow|npm run build && npm test -- --run
CASES

echo "6. Hard rule: a feature branch takes main in by rebase, never by a merge"
git switch -q -c feature/rebase-rule
echo four >feature.txt && git add feature.txt && git commit -q -m "work on the branch" >/dev/null 2>&1
git push -q -u origin feature/rebase-rule >/dev/null 2>&1
git switch -q main
echo five >main-moves.txt && git add main-moves.txt && FV_SKIP_HOOKS=1 git commit -q -m "main moves on (test setup)"
FV_SKIP_HOOKS=1 git push -q origin main >/dev/null 2>&1
git switch -q feature/rebase-rule
out="$(git merge --no-edit origin/main 2>&1)"; expect_refused "git merge origin/main on a feature branch is refused (pre-merge-commit)" $? "$out"
git merge --abort 2>/dev/null; git reset -q --hard
git merge -q --no-commit --no-ff origin/main >/dev/null 2>&1
out="$(git commit -m "merge main by hand" 2>&1)"; expect_refused "committing a prepared merge of main is refused (pre-commit)" $? "$out"
git merge --abort 2>/dev/null; git reset -q --hard
while IFS='|' read -r want cmd; do
  [ -z "$want" ] && continue
  res="$(bash_guard "$cmd")"
  if [ "$want" = "deny" ]; then expect_deny "denied:  $cmd" "$res"; else expect_quiet "allowed: $cmd" "$res"; fi
done <<'CASES'
deny|git merge origin/main
deny|git merge main
deny|rtk git merge --no-edit origin/main
deny|git pull origin main
deny|git push --force origin feature/rebase-rule
deny|git push -f origin feature/rebase-rule
deny|git push --force-with-lease origin main
allow|git pull --rebase origin main
allow|git fetch origin && git rebase origin/main
allow|git push --force-with-lease origin feature/rebase-rule
allow|git merge --abort
allow|git merge feature/other-branch
CASES
out="$(git rebase origin/main 2>&1)" && ok "git rebase origin/main on the feature branch works" || bad "rebase failed: $out"
out="$(git push origin feature/rebase-rule 2>&1)"; code=$?
if [ "$code" -ne 0 ]; then ok "a plain push of the rebased branch is rejected by git (not a fast-forward)"; else bad "plain push of a rebased branch went through: $out"; fi
out="$(git push --force-with-lease origin feature/rebase-rule 2>&1)"; code=$?
gates="$(printf '%s\n' "$out" | grep -E '^GATE-[a-z]+$' | tr '\n' ' ')"
if [ "$code" -eq 0 ] && [ "$gates" = "GATE-lint GATE-unit GATE-build GATE-visual " ]; then ok "git push --force-with-lease of the rebased branch runs the gates and lands"; else bad "force-with-lease push: exit=$code gates='$gates': $out"; fi
merges="$(git rev-list --merges --count origin/main..HEAD)"
if [ "$merges" = 0 ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/feature/rebase-rule)" ]; then ok "the branch is on origin, on top of main, without a merge commit"; else bad "after the rebase: merges=$merges"; fi

echo "7. Hard rule in code: a branch with a merge commit of its own is refused at push (.githooks/pre-push)"
git switch -q -c feature/part-a --no-track origin/main
echo a >part-a.txt && git add part-a.txt && git commit -q -m "part a" >/dev/null 2>&1
git switch -q -c feature/part-b --no-track origin/main
echo b >part-b.txt && git add part-b.txt && git commit -q -m "part b" >/dev/null 2>&1
git merge -q --no-ff --no-edit feature/part-a >/dev/null 2>&1 # merging another feature branch is possible locally
out="$(git push -u origin feature/part-b 2>&1)"; code=$?
if [ "$code" -ne 0 ] && printf '%s' "$out" | grep -q "REFUSED — 'feature/part-b' carries a merge commit" && ! printf '%s' "$out" | grep -q 'GATE-'; then ok "the push of a branch with a merge commit is refused before any gate runs"; show "$out"; else bad "merge-commit push: exit=$code: $out"; fi
report="$(node "$src/scripts/release/status.mjs" 2>&1)"
if printf '%s' "$report" | grep -q 'merge commit(s) of its own: the push will be refused → git fetch && git rebase origin/main'; then ok "release:status flags the merge commit and prints the rebase command"; else bad "status did not flag the merge commit: $(printf '%s' "$report" | head -8)"; fi
out="$(git rebase origin/main 2>&1)"; merges="$(git rev-list --merges --count origin/main..HEAD)"
if [ "$merges" = 0 ] && [ -f part-a.txt ] && [ -f part-b.txt ]; then ok "git rebase origin/main makes the branch linear and keeps both commits"; else bad "rebase left merges=$merges: $out"; fi
out="$(git push -u origin feature/part-b 2>&1)"; code=$?
gates="$(printf '%s\n' "$out" | grep -E '^GATE-[a-z]+$' | tr '\n' ' ')"
if [ "$code" -eq 0 ] && [ "$gates" = "GATE-lint GATE-unit GATE-build GATE-visual " ]; then ok "the linear branch is pushed and the gates run"; else bad "push after rebase: exit=$code gates='$gates': $out"; fi
git switch -q main
echo six >main-moves-again.txt && git add main-moves-again.txt && FV_SKIP_HOOKS=1 git commit -q -m "main moves on again (test setup)"
FV_SKIP_HOOKS=1 git push -q origin main >/dev/null 2>&1
git switch -q feature/part-b
report="$(node "$src/scripts/release/status.mjs" 2>&1)"
if printf '%s' "$report" | grep -q '1 behind   ⚠ behind main → git fetch && git rebase origin/main'; then ok "release:status flags a branch that is behind main with the rebase command"; else bad "status did not flag the branch as behind: $(printf '%s' "$report" | head -8)"; fi
out="$(git push origin "$(git rev-parse feature/part-b)":refs/tags/selftest-tag 2>&1)" && ok "a tag push is not subject to the branch rule" || bad "tag push failed: $out"

echo ""
echo "8. BACKLOG.md drift is reported (scripts/release/status.mjs, goodbye step 4)"
printf '%s\n' '# Backlog' '' '## In flight (test)' '' '| Branch / chat | Takes |' '|---|---|' '| `feature/part-b` | still here |' '| `feature/long-gone` | merged and deleted |' '| kept chat "x" | mentions `docs/some/file.md` in the second cell: `feature/not-a-row-name` |' '' '---' >BACKLOG.md
report="$(node "$src/scripts/release/status.mjs" 2>&1)"
if printf '%s' "$report" | grep -q '"In flight" names `feature/long-gone`: no such branch'; then ok "release:status flags an In-flight row whose branch is gone"; else bad "status did not flag the stale In-flight row: $(printf '%s' "$report" | tail -6)"; fi
if printf '%s' "$report" | grep -q -e 'names `feature/part-b`' -e 'names `feature/not-a-row-name`'; then bad "status flagged a live branch or a name outside the first cell: $(printf '%s' "$report" | tail -6)"; else ok "a live branch and names outside the first cell are left alone"; fi
rm -f BACKLOG.md
report="$(node "$src/scripts/release/status.mjs" 2>&1)"
if printf '%s' "$report" | grep -q 'BACKLOG.md      last changed on main never'; then ok "a checkout without BACKLOG.md is reported, not an error"; else bad "status without BACKLOG.md: $(printf '%s' "$report" | tail -4)"; fi

echo ""
echo "release selftest: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
