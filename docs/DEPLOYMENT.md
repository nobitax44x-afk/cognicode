# CogniCode — Deployment Guide

> Version 2.0.1 · Covers local build, the bundled Express server, static hosting (recommended), Firebase setup, environment configuration, and rollback.

---

## 1. Deployment Topologies

| Topology | Use when | Effort |
| --- | --- | --- |
| **A. Static hosting** (recommended) | Zero-ops, global CDN, free tiers | Low |
| **B. Express server** (`dist/server.cjs`) | You need `/api/health`, a Node process, custom headers | Medium |
| **C. Both** | Express behind a CDN/proxy (best of both) | Medium |

The client bundle is identical in all topologies — CogniCode has no server-side features except static serving and a health probe.

## 2. Prerequisites

- Node.js 18+ (20 LTS recommended), npm 9+
- A Firebase project (only if you want authentication to work)
- Git

## 3. Build

```bash
git clone https://github.com/nobitax44x-afk/cognicode.git
cd cognicode
npm ci                 # reproducible install from package-lock.json
npm run lint           # tsc --noEmit — must pass
npm run build          # vite build  +  esbuild server.ts → dist/
```

**Outputs of `npm run build`:**

```
dist/
├── assets/            # hashed JS/CSS bundles
├── index.html
└── server.cjs         # bundled Express server (esbuild, CJS, external packages)
```

## 4. Option A — Static Hosting (Vercel / Netlify / Firebase Hosting / Cloudflare Pages)

```bash
npm ci && npm run build
# Publish the dist/ directory
```

| Host | Config |
| --- | --- |
| **Vercel** | Framework preset: Vite; build `npm run build`; output `dist`; SPA rewrite `/* → /index.html` |
| **Netlify** | Build `npm run build`; publish `dist`; add `/* /index.html 200` to `netlify.toml`/`_redirects` |
| **Firebase Hosting** | `firebase.json`: `{ "hosting": { "public": "dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] } }` |
| **Cloudflare Pages** | Build `npm run build`; output `dist`; SPA mode on |

**Important:** the app uses only hash/anchor navigation (`#home`, `#upload`) plus state-based view switching, so deep-link rewrites are optional but recommended for robustness.

## 5. Option B — Express Server (Node)

```bash
npm ci
npm run build
npm start              # NODE_ENV=production  PORT=3000  HOST=0.0.0.0
```

- Serves `dist/` with `index.html` fallback for non-`/api` GETs.
- `GET /api/health` → `{ status, service, version, uptime, timestamp }`.
- Headers hardened: `x-powered-by` disabled.

**Process management (production):**

```bash
# systemd unit sketch (/etc/systemd/system/cognicode.service)
[Service]
WorkingDirectory=/opt/cognicode
ExecStart=/usr/bin/node dist/server.cjs
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=always
```

or with PM2: `pm2 start dist/server.cjs --name cognicode`.

**Reverse proxy (nginx sketch):**

```nginx
server {
  listen 443 ssl;
  server_name cognicode.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

## 6. Option C — Express behind a CDN

1. Deploy `dist/` to the CDN (Option A).
2. Run the Express server on a private host for `/api/health` monitoring only.
3. Point your uptime monitor at `https://cdn-host/api/health` (forward `/api/*` to the origin, everything else to the CDN).

## 7. Firebase Configuration

1. **Create the project** — console.firebase.google.com → Add project.
2. **Enable providers** — Authentication → Sign-in method → enable *Email/Password*, *Google*, *GitHub*.
3. **Register the web app** — Project settings → Your apps → `</>` → copy the config object.
4. **Replace config** in `src/firebase/firebase.ts`:

   ```ts
   const firebaseConfig = {
     apiKey: '...',
     authDomain: 'your-project.firebaseapp.com',
     projectId: 'your-project',
     storageBucket: 'your-project.firebasestorage.app',
     messagingSenderId: '...',
     appId: '...',
     measurementId: '...',   // optional
   };
   ```

5. **Authorized domains** — Authentication → Settings → Authorized domains: add your production domain(s) **and** preview domains (e.g. `your-app.vercel.app`, `*.monkeycode-ai.live` if used). Without this, popup sign-in fails with `auth/unauthorized-domain`.
6. **Firestore (optional, future)** — deploy the shipped rules when you enable Firestore:
   ```bash
   firebase deploy --only firestore:rules
   ```

## 8. Environment Configuration

### 8.1 Client (`VITE_*` — build-time)

Copy `.env.example` → `.env.local`:

```bash
VITE_AI_PROVIDER=openai
VITE_AI_MODEL=gpt-4o-mini
VITE_AI_API_KEY=            # leave empty in production
VITE_AI_BASE_URL=           # optional OpenAI-compatible relay
VITE_GEMINI_API_KEY=        # optional convenience default
```

> ⚠️ **Security note:** `VITE_*` variables are inlined into the client bundle at build time. **Do not** ship real API keys this way — the bundle is public. Users should enter their own keys in the UI (stored in their browser's `localStorage`).

### 8.2 Server (runtime)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `production` | Log/behaviour switches |

## 9. Hosting Notes & Headers

Recommended security headers (set at CDN/proxy level):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com wss: https:; img-src 'self' data: blob: https:
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

> The `connect-src` policy must allow the AI provider endpoints users configure; if you support arbitrary OpenAI-compatible base URLs, a permissive `connect-src https:` is simpler (trade-off documented in `docs/RECOMMENDATIONS.md`).

**Vite dev caveat:** `vite.config.ts` sets `server.allowedHosts: ['.monkeycode-ai.live']` — add your own preview hosts there or remove the restriction for local development.

## 10. CI/CD (recommended)

```yaml
# .github/workflows/ci.yml (suggested — not yet in repo)
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # deploy dist/ to your host (vercel/netlify/firebase actions)
```

## 11. Rollback & Monitoring

- **Rollback:** re-deploy the previous `dist/` (immutable build artifacts on most hosts) or `git checkout <tag> && npm run build`.
- **Health:** `GET /api/health` (status, version, uptime, timestamp).
- **Client errors:** browser console is the primary signal (the app logs `[cognicode:diagrams]` debug stats); add Sentry/Vercel Analytics if desired.
- **Auth incidents:** Firebase Console → Authentication → (activity logs).

## 12. Release Checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Auth works on the target domain (authorized domains updated)
- [ ] Google/GitHub popups not blocked (no sandboxed iframe)
- [ ] AI assistant connects with a test key (CORS verified for the provider)
- [ ] Light/dark themes render correctly; Mermaid diagrams render in both
- [ ] ZIP upload, folder upload, limits enforced
- [ ] `/api/health` reachable (topology B/C)
- [ ] CSP headers in place on production
