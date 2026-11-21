# Where the good-morning routine comes from

Researched on 2026-11-21 in public repositories of agentic coding (pages fetched that day through a summarising reader: re-check a wording before quoting it further). None of the sources asks who the human is; the identity question and the PIN are this repository's own (docs/decisions/0005-who-is-at-the-keyboard.md).

| Practice we adopted | Seen in |
|---|---|
| Cheap, deterministic state by a session-start hook; keep it tiny, because it fires on every start, resume and compaction | Claude Code hooks reference (code.claude.com/docs/en/hooks: "SessionStart runs on every session, so keep these hooks fast"), steveyegge/beads (`bd prime`, about 1–2k tokens), disler/claude-code-hooks-mastery |
| The heavier catch-up is one explicit command, not a hook | disler `/prime`, humanlayer `resume_handoff`, SuperClaude `/sc:load`, the `/catchup` pattern (blog.sshh.io) |
| Read the last handover completely, then verify it against the repository | humanlayer `resume_handoff` ("Never assume handoff state matches current state"), davila7/claude-code-templates session-handoff |
| Grade the note's freshness before trusting it | davila7 session-handoff (FRESH … VERY_STALE) |
| One next step, not the whole backlog | eyaltoledano/claude-task-master (`next`), beads (`bd ready`) |
| Decide the mode of the session first and route to it | vanzan01/cursor-memory-bank (`/van` grades and routes), BMAD-METHOD (loads configured language and greets) |
| A short report with fixed sections and a single closing question; act only after the answer | humanlayer `resume_handoff` |
| Pair the start with the end: what the close writes, the start reads | humanlayer create/resume handoff, Cline Memory Bank, SuperClaude save/load, beads |
| Keep static rules and full rule sets out of the routine | Claude Code hooks reference (static context belongs in CLAUDE.md), vanzan01 (lazy loading) |
| Few, simple commands | blog.sshh.io: a long list of complex custom commands is called an anti-pattern |

Known pitfalls the routine is built around: a handover note "can say 'done' about work that never landed" (anthropics/claude-code issue 11455, commenters); reading everything at every start is the costly pattern (Cline's own docs suggest scoping it).
