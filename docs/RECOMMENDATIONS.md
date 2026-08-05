# CogniCode — QA Findings & Recommendations

> Result of the full-project audit (Step 2 of the analysis workflow) with prioritized, actionable recommendations. **Every finding below was verified against the actual v2.0.1 source code** — nothing is speculative.

---

## 1. Audit Summary

| Dimension | Verdict |
| --- | --- |
| Import integrity | ✅ 123/123 relative imports resolve (2 triaged false positives) |
| Runtime-blocking bugs | 5 found → **all fixed in v2.0.1** |
| Dead code | 3 empty stubs removed; 5 full modules documented as reserved |
| Dependency hygiene | 2 genuinely unused packages; 5 toolchain packages explained |
| Security posture | Good baseline; 3 hardening recommendations below |
| Performance | Well-bounded (caps, caching, lazy loading); 2 optimizations suggested |
| Accessibility | Strong (skip link, ARIA, keyboard); 3 improvements suggested |
| SEO | Minimal but adequate for an SPA; 3 additions suggested |

## 2. Verified Findings (with fix status)

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| F1 | `server.ts` empty → `dev`/`build`/`start` broken | 🔴 High | ✅ Fixed (real Express server + health endpoint) |
| F2 | Duplicate README-settings button in workspace header | 🟠 Medium | ✅ Fixed |
| F3 | Default AI model `deepseek-v4-flash` does not exist | 🟠 Medium | ✅ Fixed (provider-appropriate default) |
| F4 | Dead conditional in `generator.ts` install-command fallback | 🟡 Low | ✅ Fixed |
| F5 | Download always named `README.md` | 🟡 Low | ✅ Fixed (`<project>-README.md`) |
| F6 | `firestore.rules` empty (unready for future Firestore) | 🟡 Low | ✅ Fixed (locked-down rules) |
| F7 | 3 zero-byte source stubs + empty `bun.lock` | 🟡 Low | ✅ Removed |
| F8 | `ResultPanel`, `pages/Login`, `pages/Profile`, `pages/Settings` orphaned | 🟠 Medium | 📋 Documented (reserved) |
| F9 | `@google/genai`, `jsdom` unused in code | 🟡 Low | 📋 Recommend removal |
| F10 | `userProfile` hardcoded `{ role: 'Member' }` | 🟡 Low | 📋 Documented (Firestore staged) |
| F11 | `mermaidTheme.ts` ⇄ `mermaidRenderer.ts` circular import | 🟡 Low | 📋 Documented |

## 3. Security Recommendations

1. **🔴 Ship a CSP.** The current deployment has no `Content-Security-Policy`. Recommended starter policy (see `docs/DEPLOYMENT.md` §9). Note that arbitrary OpenAI-compatible base URLs require `connect-src https:` — accept the trade-off deliberately.
2. **🟠 Audit new rendering surfaces.** React-markdown HTML escaping and Mermaid `securityLevel: 'strict'` are the two guards protecting `localStorage` AI keys. Any future custom renderer must be reviewed before merge.
3. **🟡 Add `npm audit` to CI.** The lockfile is current at audit time, but dependencies must be watched. Also remove `@google/genai` when convenient.
4. **🟡 Never ship real keys in `VITE_*` env vars** — they are inlined into the public bundle. Documented in `docs/DEPLOYMENT.md`.

## 4. Performance Recommendations

| # | Suggestion | Impact |
| --- | --- | --- |
| P1 | Run `analyzeFiles` + `generateDiagrams` in a **Web Worker** for >100-file projects; post results via structured clone | Keeps UI responsive; current sync pass can jank on large uploads |
| P2 | **Incremental analysis**: when files are added/removed, only re-parse the delta instead of the full set (currently `runAnalysis` re-parses everything) | Faster iteration in the workspace |
| P3 | Memoize `generateReadme` on `(analysis, options, diagrams)`; currently re-renders on every keystroke in the editor (options object identity changes) | Smoother editing on large READMEs |
| P4 | Code-split `mermaid` already done (`import('mermaid')`); consider preloading it *after* first upload instead of at boot | Minor initial-load win |
| P5 | Cap already healthy: 32 nodes / 40 edges / 16 classes / 6 entities / 44 tree entries | Keep as invariants in tests |

## 5. Accessibility Recommendations

| # | Suggestion | WCAG ref |
| --- | --- | --- |
| A1 | Add **focus trapping** to `AuthModal`, `AssistantSettingsModal`, `ReadmeSettingsModal` (Escape works; focus can tab out of the dialog) | 2.4.3 |
| A2 | Add `aria-modal="true"` + `role="dialog"` consistently and return focus to the trigger on close | 2.4.3 / 4.1.2 |
| A3 | Give the duplicated `aria-label="AI assistant"` elements distinct labels (header vs drawer) | 4.1.1 |
| A4 | Verify contrast of `text-app-faint` on `app-bg-subtle` in light mode (currently ~3.2:1 for small text — borderline) | 1.4.3 |
| A5 | Add visible focus indicators for custom checkbox/switch components (`focus-visible` rings are present on buttons/inputs only) | 2.4.7 |

## 6. SEO Recommendations

| # | Suggestion |
| --- | --- |
| S1 | Add Open Graph + Twitter Card meta tags (`og:title`, `og:description`, `og:image`) to `index.html` |
| S2 | Add `og:image`/screenshot asset and canonical URL |
| S3 | Add structured data (`SoftwareApplication` JSON-LD) for rich results |
| S4 | Consider `prerender`/SSG of the landing page for crawlers that don't execute JS |

## 7. Code Quality & Maintainability

| # | Suggestion |
| --- | --- |
| C1 | **Automated tests**: vitest unit suites for parser/diagrams/generator/utils + Playwright E2E for the pipeline (packages already installed) — see `docs/TESTING.md` |
| C2 | Extract `App.tsx` state machine into a `useWorkspace` hook/reducer (475 lines) |
| C3 | Break the `mermaidTheme ⇄ mermaidRenderer` cycle by moving theme variables to a standalone module |
| C4 | Standardize modal behavior in a shared `useModalDialog` hook (Escape, focus trap, body scroll lock — currently duplicated) |
| C5 | Move Firebase config to `import.meta.env.VITE_FIREBASE_*` so deployments don't edit source |
| C6 | Add ESLint + Prettier configs (only `tsc --noEmit` exists as `lint`) |
| C7 | `npm run dev` semantics: document (or alias) `vite` for HMR; current `tsx server.ts` serves the built bundle |
| C8 | Add `vite-plugin-pwa` for offline support and a `robots.txt`/`sitemap.xml` |

## 8. Product Recommendations

| # | Suggestion | Value |
| --- | --- | --- |
| R1 | Wire the reserved **Profile/Settings pages** into the workspace (avatar menu, diagram theme, notifications) — they are already implemented and currently unreachable | Completes the auth story |
| R2 | Persist generated READMEs + project snapshots to **Firestore** (rules ready) with a "My documents" library | Retention & return visits |
| R3 | Add **share links** (hash-encoded project summary + README) — client-side friendly | Viral growth |
| R4 | i18n (English/Bengali at minimum, matching the author's locale) | Reach |
| R5 | Dark-mode-safe PNG export (currently exports with current theme — fine, but consider white-bg option) | Polish |
| R6 | GitHub Actions CI (typecheck + audit + build + optional deploy) | Engineering hygiene |

## 9. Recommendation Priority Order

**Now (next release):** C1 automated tests, S1 OG meta, A1/A2 focus trap, R1 wire profile pages, P3 memoize generator.

**Soon:** C5 env-based Firebase config, P1 Web Worker, R2 Firestore library, C2 reducer extraction.

**Later:** R3 share links, R4 i18n, R5 export polish, S2–S4 SEO extras, C6 lint config, P2 incremental analysis.
