# CogniCode — Testing Documentation

> Version 2.0.1 · Describes the current testing posture (static QA audit + manual test matrix) and the planned automated suite (vitest + Testing Library + Playwright, whose packages are already declared in `devDependencies`).

---

## 1. Current Testing Status

| Area | Status |
| --- | --- |
| Static type-check (`tsc --noEmit`) | Available via `npm run lint` — pass required before merge |
| Static QA audit | ✅ Performed (see §2) |
| Unit tests | ❌ Not yet implemented |
| Component tests | ❌ Not yet implemented |
| E2E tests | ❌ Not yet implemented (Playwright installed) |
| Manual test matrix | ✅ Defined (see §4) |

## 2. Static QA Audit Results (v2.0.1 audit)

Performed with a reproducible Python/TypeScript static-analysis pass over the whole repository (79 files, ≈9,000 lines):

| Check | Result |
| --- | --- |
| Relative import resolution (123 imports) | ✅ All resolve (2 triaged false positives: template-string content in `sampleProjects.ts`; directory-index `./parser`) |
| Zero-byte files (7) | 3 source stubs removed; `server.ts` implemented; `firestore.rules` populated; `bun.lock` removed; `firebase-applet-config.json` documented |
| Orphaned components/pages | 5 documented (reserved): `ResultPanel`, `Login`, `Profile`, `Settings` pages |
| Duplicate UI controls | 1 fixed (duplicate README-settings button in `WorkspaceLayout`) |
| Dead expressions | 1 fixed (`(analysis.packageManager ? null : null)` in `generator.ts`) |
| Invalid defaults | 1 fixed (non-existent default AI model → provider-appropriate default) |
| Dependency hygiene | `@google/genai`, `jsdom` unused (recommended removal); `dotenv`/`@types/*`/`esbuild` now used by `server.ts` pipeline |
| Security posture | ✅ Markdown HTML escaping, Mermaid `strict`, no server secrets, `x-powered-by` disabled |

## 3. Planned Automated Test Suite

### 3.1 Unit tests (vitest + jsdom — packages present)

```ts
// example: src/lib/__tests__/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateReadme } from '../generator';
import { DEFAULT_OPTIONS, type ProjectAnalysis } from '../../types';

const analysis = { projectName: 'demo', language: 'TypeScript', fileCount: 3, /* … */ } as ProjectAnalysis;

describe('generateReadme', () => {
  it('emits the title and description', () => {
    const md = generateReadme(analysis, { ...DEFAULT_OPTIONS, projectName: 'demo' });
    expect(md).toContain('# demo');
  });
  it('embeds selected diagrams as mermaid fences', () => {
    const md = generateReadme(analysis, DEFAULT_OPTIONS, [{ id: 'flow', title: 'Data Flow', source: 'flowchart LR', selected: true } as never]);
    expect(md).toContain('```mermaid');
  });
});
```

Priority unit suites:

| Suite | Focus |
| --- | --- |
| `parser/*.test.ts` | import/class extraction per language; string/comment false-positive cases |
| `diagrams.test.ts` | graph resolution, cycle detection, caps, valid Mermaid output |
| `generator.test.ts` | section composition, badges, ToC, options matrix |
| `utils.test.ts` | `formatBytes`, `slugify`, `extOf`, `countLines` |
| `analyzer.test.ts` | package-manager detection, language detection, structure tree |
| `AuthContext.test.tsx` | friendly error mapping, provider state |

### 3.2 Component tests (vitest + @testing-library/react)

- `ProjectUploader` — limits, skip-lists, zip extraction, error toasts.
- `WorkspaceSidebar` — section toggling, diagram selection.
- `DiffView` — LCS diff correctness (add/del/same lines).
- `AuthModal` — tab switching, validation errors.

### 3.3 E2E (Playwright)

| Spec | Scenario |
| --- | --- |
| `pipeline.spec.ts` | Load sample → workspace → generate → README contains title → copy/download |
| `upload.spec.ts` | File input, folder input (setInputFiles with paths), ZIP upload, >200 files rejection |
| `auth.spec.ts` | Register (validation matrix), login, social provider mocked, pending-action resume |
| `assistant.spec.ts` | Mock SSE endpoint → stream renders → suggestion diff → accept/reject |
| `theme.spec.ts` | Toggle theme persists; diagrams render in both themes |

```bash
# run scripts to add to package.json:
# "test": "vitest run", "test:watch": "vitest", "e2e": "playwright test"
```

## 4. Manual Test Matrix (v2.0.1)

| ID | Area | Steps | Expected |
| --- | --- | --- | --- |
| M1 | Upload — files | Select 3 files | List shows 3; analysis runs; workspace opens |
| M2 | Upload — folder | Pick a folder with nested dirs | Tree + structure preserved; junk dirs excluded |
| M3 | Upload — zip | Drop `workspace_3.zip` | Entries extracted; text read; binaries marked |
| M4 | Limits | 201 files / >10 MB file / >60 MB total | Specific error toasts |
| M5 | Auth gate | Upload while logged out | AuthModal opens; action resumes after login |
| M6 | Analysis | Load each of the 3 sample projects | Correct language, package manager, entry point, endpoints |
| M7 | Diagrams | Generate each of the 6 kinds | Renders in light + dark; no parse-error text |
| M8 | Repair | Feed a project that produced a broken diagram | Auto-repair engages; valid output |
| M9 | Generation | Toggle all 9 sections + badges/ToC/stats/structure/emoji | README reflects every toggle |
| M10 | Regenerate | Change a file set, regenerate diagrams | Diagrams refresh |
| M11 | Export | Export 1 and all diagrams | SVG + PNG download with slug names |
| M12 | AI | Configure OpenAI-compatible key → ask to rewrite | Streaming tokens; diff suggestion; accept/reject |
| M13 | AI errors | Wrong key / no config | Settings modal opens / friendly error in chat |
| M14 | Auth errors | Wrong password, existing email, weak password | Friendly messages (12 codes mapped) |
| M15 | Theme | Toggle + reload | Persists; no flash; diagrams themed |
| M16 | Responsive | 320 / 768 / 1280 px | Sidebar/drawer/assistant behave; no overflow |
| M17 | Keyboard | Tab through landing; Escape closes modals | Focus visible; focus not trapped on open |
| M18 | Server | `npm run build && npm start`; `curl /api/health` | 200 JSON; SPA fallback for unknown routes |
| M19 | Download | Generate → Download | File named `<project>-README.md` |
| M20 | Privacy | DevTools network tab during analysis | No outbound requests except Firebase/AI |

## 5. Test Data

- **Sample projects** (`src/data/sampleProjects.ts`): `pulse-monitor` (TS CLI, vitest/eslint), `fastapi-service` (Python/FastAPI, Dockerfile), `forge-cli` (Go, cobra, Makefile, Go test) — cover 3 ecosystems, 2 lockfile types, Docker detection, test detection.
- **Regression archive:** the QA audit used `workspace_3.zip` (this repository) — a 79-file React/TS project exercising JS/TS parsers, JSON configs, structure tree, and endpoints.

## 6. Defect Tracking Conventions

- Severity levels: `blocker / high / medium / low`.
- Each fix in v2.0.1 is recorded in `docs/CHANGELOG.md` with module and impact.
- Regressions gate on M7 (diagrams), M9 (generation), M12 (AI), M15 (theme) at minimum.
