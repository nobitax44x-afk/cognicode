# CogniCode — User Guide

> A practical manual for end users: from first visit to downloading your generated README.

---

## 1. What Is CogniCode?

CogniCode turns a folder of source code into a professional `README.md` — automatically, in your browser. It:

- reads your files **locally** (they never leave your device),
- analyzes structure, languages, dependencies, entry points and endpoints,
- draws **6 architecture diagrams** (Mermaid),
- writes a complete README you can customize, and
- optionally lets an **AI assistant** (your own API key) refine it.

## 2. Quick Start (60 seconds)

1. Open the CogniCode website.
2. Click **Upload your project** and choose files, a folder, or a `.zip` archive.
3. If asked, **log in** (email/password, Google, or GitHub). Your upload continues automatically after sign-in.
4. Wait for *Analyzing…* and *Diagrams…* — the pipeline indicator shows progress.
5. Review the diagrams and settings in the workspace sidebar.
6. Click **Generate**. Your README appears in the preview pane.
7. Click **Copy** or **Download** — done.

> No project at hand? Click one of the **sample projects** (TypeScript CLI, Python FastAPI, Go CLI) on the landing page.

## 3. Uploading a Project

| Method | How |
| --- | --- |
| Individual files | Click the upload area and multi-select, or drag & drop |
| Whole folder | Use the **folder** picker (browsers keep relative paths) |
| ZIP archive | Drop any `.zip` — extracted automatically (JSZip) |

**Limits (v2.0.1):** max 200 files, max 10 MB per file, max 60 MB total. `node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `coverage`, `.vscode`, `.idea`, `vendor`, `target` and similar directories are skipped automatically.

**Managing files:** hover a file row to **remove** it (analysis re-runs), or use **Clear all**.

## 4. The Workspace

The workspace has four zones:

```
┌──────────────────────────────────────────────────────────────┐
│ Header: back · project name/stats · progress · actions       │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │  Editor / Preview (split on desktop)         │
│ · project     │  ┌────────────────────────────────────────┐  │
│   stats       │  │ preview (or markdown editor)           │  │
│ · sections    │  └────────────────────────────────────────┘  │
│ · diagrams    │  AI assistant (right drawer, floating ✨)     │
├───────────────┴──────────────────────────────────────────────┤
│ Floating AI assistant button (bottom-right)                   │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Sidebar

- **Project stats** — files, lines, language, detected endpoints.
- **Sections** — check the README sections you want (Overview, Features, Installation, Usage, Configuration, API Reference, Contributing, License, Contact).
- **Diagrams** — toggle which of the 6 diagrams get embedded into the README.

### 4.2 Header actions

| Action | Effect |
| --- | --- |
| **Config** | Toggle sidebar (desktop) / drawer (mobile) |
| **Copy** | Copy the README to clipboard |
| **Download** | Save `<project>-README.md` |
| **Export** | Download selected diagrams as SVG + PNG |
| **Settings (⚙)** | Full README options modal |
| **Generate** | Build the README from current options |

### 4.3 Edit & preview

- On desktop, editor and preview are side-by-side; on mobile use the **Preview / Edit Markdown** tabs.
- The preview renders GitHub-style Markdown, **including Mermaid diagrams** live.
- Any manual edit is preserved unless you toggle a section/diagram (which re-renders from options).

## 5. README Settings

Open the settings modal (⚙) to control:

- **Project name, description** — auto-filled from analysis; editable.
- **Tech stack** — tag input with suggestions from the analysis.
- **Install / usage commands** — pre-filled per package manager (npm, yarn, pnpm, bun, cargo, go, pip, …).
- **Usage instructions** — free text shown in the Usage section.
- **License, Author, Repository URL.**
- **Advanced:** badges, table of contents, structure block, stats table, emoji headers.

## 6. The AI Assistant

1. Click **✨** (floating button) to open the assistant.
2. First time: click **Connect a provider** and enter your key (OpenAI-compatible, Anthropic, or Gemini), model, and optional base URL. The key is stored only in your browser.
3. Chat naturally: *"shorten the features section"*, *"add a troubleshooting section"*, *"rewrite the overview"*.
4. When the assistant returns a **full revised README**, a diff bar appears above the editor showing `+additions −removals` with **Accept** / **Reject** buttons.
5. **Stop** (■) cancels streaming mid-response.

> Tip: the assistant knows your project summary and current README. Diagrams are regenerated from code via the **Diagrams** button in the assistant header — the AI cannot draw them itself.

## 7. Exporting Diagrams

1. In the sidebar, ensure at least one diagram is selected.
2. Click **Export** in the header.
3. Files download as `<diagram-slug>.svg` and `<diagram-slug>.png` (2× resolution).

## 8. Accounts

| Feature | How |
| --- | --- |
| Register | Auth modal → **Register** → name/email/password (strength meter: 8+ chars, upper, lower, digit, special) |
| Login | Email/password (+ *Remember me*) or Google/GitHub |
| Forgot password | **Forgot password?** → email → reset link |
| Logout | User menu (avatar) → **Sign out** |

## 9. Theme

Toggle **🌙/☀️** in the navbar. Your choice persists; the site also respects your OS preference on first visit. Diagrams restyle to match.

## 10. Frequently Asked Questions

- **Is my code uploaded to a server?** No. All analysis runs in your browser. Only the README *text* is sent to the AI provider if you use the assistant.
- **Why do I need an account?** The workspace is gated behind sign-in (anti-abuse). Uploads resume automatically after login.
- **Which languages are supported?** TypeScript/JavaScript, Python, Go, Rust, Java/Kotlin, C#, PHP, Ruby, C/C++, Swift, Dart, Vue, Svelte, and more (28 extensions).
- **My diagram shows an error** — press **Regenerate** in the assistant or re-upload; the auto-repair handles most syntax issues.
- **AI says "couldn't reach the provider"** — check the key/model; some providers block browser calls — set a base URL relay (see Troubleshooting).

## 11. Troubleshooting

| Problem | Solution |
| --- | --- |
| Sign-in popup blocked | Allow popups; use email/password inside embedded previews |
| "This preview domain is not authorized" | The host must be added to Firebase authorized domains by the admin |
| Upload rejected | Respect 200 files / 10 MB per file / 60 MB total |
| Generated README misses a section | Enable it in the sidebar **Sections** |
| Download name looks generic | Set the project name in README settings |
| AI settings lost | Site data cleared — re-enter the key |
| Dark mode not applied | Toggle theme again; check that site data isn't blocking `localStorage` |

---

For administrators/operators see **`docs/ADMIN_GUIDE.md`**.
