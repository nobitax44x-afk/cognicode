# CogniCode — API Documentation

> Version 2.0.1 · Covers the **server HTTP surface** and the **client library surface** (the exported functions that constitute CogniCode's public API). All client APIs are browser-side; there is no remote REST API for product features — by design, source code never leaves the browser.

---

## 1. Server HTTP API

The Express server (`server.ts`) exposes a single API endpoint plus static serving.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | none | Liveness probe |
| `GET` | `/*` | none | Static bundle + SPA fallback (`index.html`) |

### `GET /api/health`

**Response 200:**

```json
{
  "status": "ok",
  "service": "cognicode",
  "version": "2.0.0",
  "uptime": 42,
  "timestamp": "2026-08-05T15:45:42.000Z"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | `"ok"` |
| `service` | string | `"cognicode"` |
| `version` | string | `npm_package_version` or fallback |
| `uptime` | number | process uptime in seconds |
| `timestamp` | string | ISO-8601 |

**Environment:** `PORT` (default 3000), `HOST` (default `0.0.0.0`), `NODE_ENV`.

---

## 2. Client Library API

### 2.1 `src/lib/analyzer.ts`

| Signature | Returns | Description |
| --- | --- | --- |
| `analyzeFiles(files: UploadedFile[]): ProjectAnalysis` | `ProjectAnalysis` | Full project analysis (identity, language, stack, structure, modules, classes, endpoints, diagnostics) |
| `buildStructure(files, maxDepth=2, maxEntries=24)` | `string[]` | ASCII project tree lines |

`ProjectAnalysis` fields: `projectName, description, packageManager, language, techStack[], dependencies[], license, fileCount, textFileCount, totalLines, structureLines, extensions, hasDockerfile, hasCIConfig, configFiles[], testFiles, modules[], classes[], entryPoints[], endpoints[], diagnostics`.

### 2.2 `src/lib/parser/index.ts`

| Signature | Returns | Description |
| --- | --- | --- |
| `parseFile(f: UploadedFile)` | `FileParseOutcome \| null` | Dispatch by extension to the language parser; never throws (errors captured) |
| `isCodeFile(path)` | `boolean` | True for the 28 supported code extensions |
| `CODE_EXTS` | `Set<string>` | Supported extensions |

`FileParseOutcome = { lang, module: ModuleNode, classes: ClassInfo[], error? }`.

**Language parsers** (`parser/{js,python,go,rust,java,csharp,php,misc}.ts`) all export `parse(path, content): ParseResult` with `{ imports: string[], exports: string[], symbols: ParsedSymbol[] }`. `ParsedSymbol` = `{ name, kind: class|abstract|interface|enum|struct|trait, superclass?, implements[], methods: MethodInfo[], properties: PropertyInfo[], line }`.

### 2.3 `src/lib/diagrams.ts`

| Signature | Returns | Description |
| --- | --- | --- |
| `generateDiagrams(analysis, files)` | `DiagramDef[]` | Six diagrams: `architecture`, `class`, `sequence`, `flow`, `er`, `state` |

`DiagramDef = { id, kind, title, description, source, selected }` — `source` is the Mermaid source string.

Generation rules (caps): architecture ≤ 32 nodes / 40 edges with directory clusters and cycle highlighting; class ≤ 16 classes with inheritance/interface edges; sequence = `Client → entry → handler → data → Client`; flow = `Input → entry → … → Data/Storage → Output`; ER ≤ 6 entities from model-like classes; state = entry-chain lifecycle.

### 2.4 `src/lib/generator.ts`

| Signature | Returns | Description |
| --- | --- | --- |
| `generateReadme(analysis, options, diagrams=[])` | `string` | Complete README markdown |

`ReadmeOptions` (from `types.ts`): `projectName, description, techStack[], sections[] (9 keys), installationCommand, usageCommand, usageInstructions, license, author, repositoryUrl, advanced { includeBadges, includeToC, showStructure, showStats, emojiHeaders }`.

### 2.5 `src/lib/ai.ts` — AI provider clients

| Signature | Description |
| --- | --- |
| `streamChat({ config, system, messages, onToken, signal? }): Promise<void>` | Stream a chat completion from the configured provider; `onToken(delta)` per token |
| `defaultModelFor(provider)` | `openai → gpt-4o-mini`, `anthropic → claude-3-5-haiku-latest`, `gemini → gemini-flash-latest` |
| `DEFAULT_MODELS` | Model map above |

`AIConfig = { provider: 'openai'|'anthropic'|'gemini', model, apiKey, baseUrl? }`.

**Wire protocol (per provider):**

| Provider | Endpoint | Auth header |
| --- | --- | --- |
| OpenAI-compatible | `{baseUrl || https://api.openai.com/v1}/chat/completions` (SSE) | `Authorization: Bearer <key>` |
| Anthropic | `https://api.anthropic.com/v1/messages` (SSE) | `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}` | `x-goog-api-key` |

Request shape: OpenAI — `{ model, messages: [system, ...history], stream: true, temperature: 0.6 }`; Anthropic — `{ model, system, messages, max_tokens: 4096, stream: true }`; Gemini — `{ system_instruction, contents: [{role: user|model, parts}] }`.

### 2.6 `src/lib/mermaidRenderer.ts` · `mermaidTheme.ts` · `mermaidRepair.ts`

| Signature | Description |
| --- | --- |
| `warmUpMermaid()` | Preload the dynamic mermaid import |
| `renderMermaidCached(source, theme)` | Cached render; auto-repair on parse failure |
| `renderMermaid(source, theme)` | Alias of the above (export surface) |
| `clearMermaidCache()` | Drop the SVG cache |
| `mermaidThemeVariables(theme)` | Theme token map for Mermaid |
| `safeId(name)` / `quote(label)` | Identifier/label sanitizers for generated sources |
| `tryParseMermaid(source)` | `{ ok: true } \| { ok: false, error, line? }` |
| `repairMermaid(source, hint?)` | Candidate repairs (string[]) |

### 2.7 `src/lib/diagramExport.ts`

| Signature | Returns | Description |
| --- | --- | --- |
| `exportDiagram(d, format='svg')` | `Promise<void>` | Download one diagram as SVG or PNG (2× scale) |
| `exportAllDiagrams(diagrams)` | `{ exported, failed }` | Download all selected diagrams as SVG + PNG |

### 2.8 `src/lib/utils.ts`

`formatBytes(n)`, `makeId()`, `slugify(s)`, `extOf(path)`, `langMetaOf(path)` → `{label, color}`, `isLikelyText(name)`, `readFileAsText(file)`, `copyText(text)`, `downloadText(content, filename, mime?)`, `countLines(content)`, `LANG_META` (extension → color map).

### 2.9 Auth API — `src/context/AuthContext.tsx`

`useAuth()` (via `src/hooks/useAuth.ts`) returns:

| Member | Type | Description |
| --- | --- | --- |
| `user` | `AuthUser \| null` | `{ uid, email, displayName, photoURL, providerData[] }` |
| `userProfile` | `{ role: string } \| null` | Currently static `{ role: 'Member' }` |
| `loading` | `boolean` | Session resolution in progress |
| `loginWithEmail(email, password, rememberMe?)` | `Promise<void>` | Persistence-aware email login |
| `loginWithGoogle()` / `loginWithGithub()` | `Promise<void>` | Popup sign-in |
| `signupWithEmail(name, email, password)` | `Promise<void>` | Register + display name |
| `updateUserProfile(displayName, photoURL?)` | `Promise<void>` | Update profile |
| `resetPassword(email)` | `Promise<void>` | Send reset email |
| `logout()` | `Promise<void>` | Sign out |
| `getFriendlyErrorMessage(err)` | `string` | Error-code → message mapper (12+ codes) |

### 2.10 Storage keys

| Key | Schema | Consumer |
| --- | --- | --- |
| `cognicode-ai-config` | JSON `AIConfig` | `useAiConfig` |
| `cognicode-theme` | `'light' \| 'dark'` | `useTheme` + `index.html` bootstrap script |

### 2.11 Sample data — `src/data/sampleProjects.ts`

`SAMPLE_PROJECTS: SampleProject[]` — three demos (`pulse-monitor` TypeScript CLI, FastAPI service, `forge-cli` Go CLI) with `id, name, description, language, color, files[]`.

---

## 3. Error Handling Conventions

- All async UI actions report through `useToast()` (`success` / `error` / `info`, 5 s auto-dismiss).
- Parser failures are captured per-file in `ProjectAnalysis.diagnostics.parserErrors` — never thrown.
- AI streaming errors surface in the assistant message (`isError: true`) with the provider detail; aborting (`AbortController`) silently stops.
- Upload failures map to user-readable messages (`MAX_FILES`, `MAX_FILE_SIZE`, `MAX_TOTAL_SIZE`, unreadable files, empty archives).

## 4. Versioning & Compatibility

- Client requires a modern evergreen browser (ES2022, `FileReader`, `navigator.clipboard` with textarea fallback, canvas for PNG export).
- Firebase JS SDK v12 — update config in `src/firebase/firebase.ts` for a different project.
- Mermaid v11 — generated sources target Mermaid 11 grammar.
