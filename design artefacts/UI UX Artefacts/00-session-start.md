# Prompt: Session Start

All design artefact files are located at: design-artefacts/UI UX Artefacts/
When referencing any design artefact file, always prefix paths with: design-artefacts/UI UX Artefacts/

---

## Paste this at the start of every Claude Code session

```
All design artefact files are at: design-artefacts/UI UX Artefacts/

Read these two files now — they are always required:
1. design-artefacts/UI UX Artefacts/COMPONENTS.md
2. design-artefacts/UI UX Artefacts/COPY_RULES.md

Do NOT read TOKENS.md, THEMES.md, or PATTERNS.md yet.
Each task prompt will tell you exactly which additional files to read.
Reading files not required for the current task wastes context — only read what the task specifies.

Session rules (apply always, no file read needed):
- Never hardcode hex colour values — always use a CSS custom property token.
- Never apply text-transform: uppercase to any element containing user-generated content.
- Never use <input type="file"> directly — always use the Dropzone component.
- Never create a new UI pattern without checking COMPONENTS.md first.
- After completing each task, mark the component ✅ BUILT in COMPONENTS.md.
- If a path has spaces, wrap it in quotes: "design-artefacts/UI UX Artefacts/TOKENS.md"

Confirm you have read COMPONENTS.md and COPY_RULES.md, then wait for the task.
```

---

## Token cost reference — know before you read

| File | ~Tokens | Read when |
|------|---------|-----------|
| COMPONENTS.md | 400 | Always |
| COPY_RULES.md | 600 | Always |
| TOKENS.md | 1,800 | Any task creating CSS or new components |
| PATTERNS.md | 1,200 | Tasks involving layout, empty states, or interaction behaviour |
| THEMES.md | 2,400 | Theme tasks only (Task 14–15) |
| overlay-card.md | 900 | Task 05–06 only |
| overflow-menu.md | 700 | Task 04–06 only |
| entity-form.md | 1,000 | Task 10 only |
| remaining-components.md | 1,400 | Tasks 03, 07, 08, 09, 11 |

**Total if you read everything upfront: ~10,500 tokens before writing a line of code.**
**Total with this strategy: ~1,000 tokens at session start.**

---

## File read guide per task

Each task in tasks-01-14.md already specifies which files to read.
This table is a quick reference if you are writing your own prompts.

| Task | Files to read |
|------|--------------|
| 01 — Token replacement | COMPONENTS.md + TOKENS.md |
| 02 — Copy/casing rules | COMPONENTS.md + COPY_RULES.md |
| 03 — ConfirmDialog | COMPONENTS.md + TOKENS.md + remaining-components.md |
| 04 — OverflowMenu | COMPONENTS.md + TOKENS.md + overflow-menu.md |
| 05 — OverlayCard | COMPONENTS.md + TOKENS.md + overlay-card.md + overflow-menu.md |
| 06 — Migrate cards | COMPONENTS.md + COPY_RULES.md + overlay-card.md + overflow-menu.md |
| 07 — EmptyState/ListPage | COMPONENTS.md + PATTERNS.md + remaining-components.md |
| 08 — Dropzone | COMPONENTS.md + TOKENS.md + remaining-components.md |
| 09 — StickyFormFooter | COMPONENTS.md + TOKENS.md + remaining-components.md |
| 10 — EntityForm | COMPONENTS.md + TOKENS.md + PATTERNS.md + entity-form.md |
| 11 — Polish pass | COMPONENTS.md + TOKENS.md + remaining-components.md |
| 12 — Combat/Theory/Mindmap | COMPONENTS.md + PATTERNS.md |
| 13 — Settings/Messages | COMPONENTS.md + PATTERNS.md |
| 14 — Theme system Phase 1 | COMPONENTS.md + TOKENS.md + THEMES.md |
| 15 — Theme FX Phase 2 | COMPONENTS.md + THEMES.md |

---

## If Claude Code loses context mid-session

Long tasks can push earlier file reads out of context. If Claude Code
starts inventing patterns or hardcoding values, paste this recovery prompt:

```
You may have lost context on the design spec. Re-read:
1. design-artefacts/UI UX Artefacts/COMPONENTS.md
2. design-artefacts/UI UX Artefacts/COPY_RULES.md
[plus whatever task-specific files the current task requires]

Then continue from where we left off.
```
