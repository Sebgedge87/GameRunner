# Prompt: Session Start (use at the beginning of every Claude Code session)

Copy and paste this at the start of every Claude Code session before giving any tasks.

---

```
Before making any changes, read these files in order:

1. /design-artefacts/COMPONENTS.md
2. /design-artefacts/TOKENS.md
3. /design-artefacts/COPY_RULES.md
4. /design-artefacts/PATTERNS.md

Rules for this session:
- Every colour value must reference a token from TOKENS.md. Never hardcode hex values.
- Every component you create or modify must match a spec in COMPONENTS.md.
  If no spec exists for something you need, ask me before inventing a pattern.
- Never apply text-transform: uppercase to any element that contains or could contain user-generated content.
- Never use <input type="file"> directly. Always use the Dropzone component.
- After completing each task, update the Status field in the relevant component spec file
  from "⬜ TODO" to "✅ BUILT".

Confirm you have read all four files before proceeding.
```

---

## Why this matters
Without anchoring to the spec files, Claude Code will:
- Invent new patterns instead of using existing components
- Hardcode colour values instead of tokens
- Recreate the same inconsistencies the refactor is trying to fix

The "Confirm you have read all four files" instruction ensures the files are
in context before any code is written.
