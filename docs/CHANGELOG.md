# CogniCode — Changelog

All notable changes to this project are documented in this file. Format based on [Keep a Changelog](https://keepachangelog.com/), and the project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.1] — 2026-08-05

### Fixed

- **`server.ts` was empty (0 bytes)** — `npm run dev` exited immediately, and the production server could not serve anything. Implemented a full Express server: serves `dist/` with an SPA fallback, exposes `GET /api/health`, honours `PORT`/`HOST`/`NODE_ENV`, disables `x-powered-by`. The `dev`/`build`/`start` scripts now function as documented.
- **Duplicate "README settings" button in the workspace header** — `WorkspaceLayout.tsx` rendered two identical `Settings2` buttons side by side. The duplicate was removed (single button retained).
- **Invalid default AI model** — `useAiConfig.ts` defaulted an OpenAI-compatible config to the non-existent model `deepseek-v4-flash`. The default is now provider-appropriate (`defaultModelFor(provider)` → `gpt-4o-mini` for OpenAI).
- **Dead conditional in README generator** — `generator.ts` contained a vacuous `(analysis.packageManager ? null : null)` clause in the install-command fallback. Removed; fallback now flows directly to `installHint(...)`.
- **Hardcoded download filename** — `App.tsx` always downloaded `README.md`; the file is now named `<project-slug>-README.md` (e.g. `cognicode-README.md`).
- **Empty `firestore.rules`** — shipped locked-down, documented rules (own-profile read only, no client writes) ready for future Firestore use.

### Removed (dead code)

- `src/components/AIRefinementDrawer.tsx` — zero-byte stub, never imported.
- `src/components/FileTreeExplorer.tsx` — zero-byte stub, never imported.
- `src/pages/Register.tsx` — zero-byte stub, never imported (registration lives in `AuthModal` → `RegisterForm`).
- `bun.lock` — zero-byte leftover; `package-lock.json` is the canonical lockfile.

### Added

- `docs/` documentation suite: `README.md`, `PROJECT_REPORT.md`, `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `DEPLOYMENT.md`, `TESTING.md`, `USER_GUIDE.md`, `ADMIN_GUIDE.md`, `DIAGRAMS.md` (16 Mermaid + PlantUML diagrams), `CHANGELOG.md`, `RECOMMENDATIONS.md`.

### Known (unchanged)

- `src/pages/{Login,Profile,Settings}.tsx` and `ResultPanel.tsx` are fully implemented but not yet wired into the app (auth uses `AuthModal`).
- `@google/genai` is not imported anywhere; `jsdom`/`playwright` are declared for a test suite that does not exist yet.

## [2.0.0] — (previous release)

### Features

- Client-side project analysis (package manager, language, tech stack, entry points, endpoints, structure tree).
- Six auto-generated Mermaid diagrams (architecture, class, sequence, data flow, ER, state) with syntax auto-repair.
- Configurable README generation (9 sections, badges, ToC, stats, structure, emoji headers).
- Split edit/preview Markdown workspace with GitHub-style rendering.
- AI assistant: streaming chat with OpenAI-compatible, Anthropic, and Gemini providers (BYO key), diff-based accept/reject suggestions.
- Firebase authentication (email/password, Google, GitHub) gating the workspace with pending-action resume.
- ZIP/folder/file uploads with limits and junk-directory exclusion; SVG/PNG diagram export.
- Sample projects (TypeScript CLI, Python FastAPI, Go CLI); light/dark theme; responsive UI.
