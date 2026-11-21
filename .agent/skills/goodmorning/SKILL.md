---
name: goodmorning
description: >-
  The start-of-day routine of the Fiore Vera repo, the counterpart of `goodbye`: asks who is at
  the keyboard (Vera or Gabor), runs `npm run content:morning`, routes the session to the right
  mode and gives a short report. Use on the first message of a day, when the session-start hook
  says "At the keyboard today: NOT SAID YET", or when someone says good morning, jó reggelt,
  /goodmorning, "start the day", "where were we", "catch me up".
---

# Good Morning

One explicit routine a day, per machine. It settles who is working, checks that the machine and the live site are fine, and says what is open — in a few lines, then asks before doing anything. It changes no content, commits nothing and pushes nothing.

*(The session-start hook prints the cheap state on every session; this is the heavier step, once a day. The close of the day is `goodbye`, which writes the handover note this routine reads.)*

## The routine

| # | Step | How | Rule |
|---|---|---|---|
| 1 | **Ask who is here** | One question, with the names from `npm run release:operator`: "Jó reggelt! Ki ül most a gépnél: Vera vagy Gábor?" | Never infer it from the language, the request or yesterday. If today's session already exists (hook line "At the keyboard today: …"), greet that person and skip to step 3 |
| 2 | **Run the routine** | `npm run content:morning -- --as <id>` | For an admin a PIN window opens: say so first ("Megjelenik egy ablak a számítógépeden: ott add meg a PIN-kódodat."). You never ask for, see or repeat a PIN. A refusal (`approval-cancelled`, `pin-wrong`, `locked`) means the person is NOT identified: stay in content mode or stop |
| 3 | **Take the mode** from `who.role` | `content` → you are the `cms-coordinator`, in Hungarian, content changes only. `admin` → content the same way, and framework work under the Release Protocol of `AGENTS.md` | A content session never drifts into code because the request sounded technical: that is an escalation (`tech-lead`, hand-over) |
| 4 | **Admin only: read the handover** | `.agent/last-session-handover.md` completely; `handover.freshness` says how much landed since | A note is a claim, not a fact: check each "done" and "next" against `git log`, `BACKLOG.md` and `npm run release:status` before repeating it. `stale` → say so and trust the repository |
| 5 | **Report** | The format below | At most three lines from `attention`, the most important first. No backlog dump, no file lists, no test runs |
| 6 | **Ask, then wait** | One closing question | Start nothing before the answer |

## The report

For Vera (Hungarian, no technical words; sentences: `cms-coordinator/resources/dialogue-hu.md`):

```
Jó reggelt, Vera!
Az oldal rendben működik.            ← or the one-sentence problem and "erről értesítenünk kell Gábort"
[Legutóbb megjelent: <last change, her words, date>]
[Félbemaradt: <what> – folytassuk, vagy vessük el?]
[Gáborra vár: <what>]
Miben segíthetek ma?
```

For Gabor (his language, facts):

```
Good morning, Gabor — admin mode (PIN accepted).
Site: healthy | Machine: can publish yes/no (<what is missing>) | Checkout: <branch>, clean/dirty, n behind
Handover (<date>, <freshness>): <the one next step it names, verified or corrected>
Attention: <up to three lines, or "nothing">
Shall I start with <that step>, or something else?
```

## What stays out (so it remains fast and is run every day)

- Anything that modifies: no content operation, no commit, no fetch beyond the routine's own, no baseline re-record.
- The full Definition of Done, e2e or visual runs: they belong to a change, not to the morning.
- Reading every skill or the whole backlog: load a skill when its trigger appears.
- More than one question, and more than three attention lines.

## Sparring Manifesto

- **Veto guessing who is here**, and veto admin work without today's accepted PIN.
- **Veto repeating a handover note unverified** — "done" in a note has been wrong before.
- **Veto a morning wall of text**: if it does not fit the format, it is not morning material.
- **Veto acting before the answer** to the closing question.

## Handshakes

- `goodbye` writes what this reads; `cms-coordinator` and the Project Coordinator take over after step 3; `release-manager` owns `npm run release:operator` and the PIN; `tech-lead` for what a content session may not do.
- Why it is shaped this way, with sources: `resources/sources.md`.
