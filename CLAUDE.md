# Claude Code project instructions

## What this repository is
- A React 18 + Vite application for Spanish learning with Arabic explanations.
- Keep Arabic learner-facing copy masculine and conversational unless the lesson content requires a different register.
- Render Spanish left-to-right and Arabic right-to-left. Isolate mixed-language content so punctuation and question choices remain readable.

## How to work
- First inspect the relevant components, data, and existing checks. Preserve unrelated user changes.
- Delegate bounded work to the repository subagents in `.claude/agents/` when useful. Run independent reviews in parallel; do not ask multiple agents to edit the same files at once.
- For Spanish-learning content, have `content-reviewer` review grammar, naturalness, translations, and lesson-level fit. Never invent or mislabel textbook audio/content.
- For UI changes, keep mobile and desktop layouts in scope and use the existing design system.
- Before proposing a change as complete, run `npm run quality:check`, `npm run build`, and `git diff --check` when the change touches the app or learning content. Report failures honestly.
- Review the full diff before committing. Do not expose, request, or write credentials in repository files or comments.
- GitHub-triggered work should be proposed on a reviewable branch/PR; never merge a PR without explicit authorization.

## Available agents
- `product-planner`: translate a request into scope, acceptance criteria, and safe task boundaries; read-only.
- `content-reviewer`: review Spanish/Arabic educational content; read-only.
- `frontend-implementer`: implement scoped React/CSS work.
- `qa-tester`: run checks and browser-facing test flows; report evidence, do not edit product files.
- `code-reviewer`: independent read-only review of a diff for correctness, regressions, and security.
