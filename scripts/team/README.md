# Free local project team

This is a no-API, no-extra-dependency automation crew for repeatable checks. These workers are deterministic scripts, **not independent AI models**; they catch missing data, broken section routes, malformed lesson pairs, bad book assets, regressions, and build failures. They do not invent lessons or rewrite content.

Run all workers concurrently:

```sh
npm run team:check
```

## Workers

- **Course coverage scout** — compares lesson units, textbook mappings, local book/reader directories, and imported activity stages for A1–B2. Missing B1/B2 source coverage is reported as a roadmap blocker, not silently treated as complete.
- **Bilingual lesson integrity** — checks required Spanish/Arabic lesson fields and vocabulary pairs.
- **Sections and responsive system** — checks that main navigation has page routes, mobile shortcuts have destinations, and RTL/LTR plus narrow-screen styles exist.
- **Arcade systems auditor** — checks all five game banks across A1/A2, distractor uniqueness, randomized and balanced correct-answer slots (never repeated on adjacent questions), per-game scoring rules, original-A1 audio-question provenance, playback gating, mode settings, score records, and one-time completion reporting.
- **Book asset auditor** — runs the existing verified scan/audio checks.
- **Quality and content QA** — runs the repository's language, story, transcript, arcade, and material assertions.
- **Production build** — confirms Vite can build the site.
- **Diff hygiene** — checks for whitespace errors.

Workers that do not depend on one another run in parallel using Node's built-in process API. No Python packages or external model/API are needed.

## Source-material rule for B1/B2

The audit only counts files and records actually present in this repository. Before creating B1/B2 textbook lessons, scans, audio, exercises, or translations, add the exact source books/files and verify their edition and unit/page map. The checker deliberately reports absent levels instead of generating substitute textbook content.
