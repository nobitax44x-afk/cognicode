# CogniCode — Admin Guide

> Operational manual for administrators and operators: Firebase administration, deployment operations, monitoring, AI provider governance, security checklist, and user support.

---

## 1. Administrative Surface Overview

CogniCode has **no traditional admin console**. Administrative duties are split across:

| Surface | Purpose |
| --- | --- |
| Firebase Console | Auth providers, authorized domains, users, security rules |
| Hosting console (Vercel/Netlify/Firebase/Node host) | Deployments, env vars, logs, rollbacks |
| `GET /api/health` | Liveness monitoring (Express topology) |
| Source repository | Releases, CI, configuration changes |

## 2. Firebase Administration

### 2.1 Identity providers

Console → **Authentication → Sign-in method**:

| Provider | Notes |
| --- | --- |
| Email/Password | Required for the fallback flow (popups can be blocked in iframes) |
| Google | Requires an OAuth consent screen; enabled by default for new projects |
| GitHub | Register an OAuth app in GitHub → paste Client ID/Secret |

### 2.2 Authorized domains

Console → **Authentication → Settings → Authorized domains**. Add every domain that hosts the app (production, previews, localhost is included by default). Missing domains produce `auth/unauthorized-domain` for users — the most common support ticket.

### 2.3 User administration

- **View/disable users:** Authentication → Users (search by email/UID).
- **Reset passwords:** send a reset email; advise users to check spam.
- **Abuse:** disable the offending account; consider rate-limit toggles per provider.

### 2.4 Security rules

`firestore.rules` (v2.0.1) — **deny-by-default**:

```js
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow write: if false;
}
```

Deploy with `firebase deploy --only firestore:rules`. **Do not loosen the write rule** until the app actually implements profile sync with server-side validation.

## 3. Deployment Operations

See `docs/DEPLOYMENT.md` for full steps. Admin-relevant operations:

| Operation | Command / Action |
| --- | --- |
| Build | `npm ci && npm run lint && npm run build` |
| Release | Tag (`git tag v2.0.1`) → CI deploy of `dist/` |
| Rollback | Redeploy previous `dist/` (immutable artifact) |
| Health check | `curl https://<host>/api/health` → `{"status":"ok",...}` |
| Logs (Express) | `journalctl -u cognicode` / `pm2 logs cognicode` |
| Env changes | Client `VITE_*`: rebuild + redeploy; server `PORT/HOST`: restart |

## 4. AI Provider Governance

Users bring their own keys — the operator does not provision AI credentials. Admin responsibilities:

1. **Documentation:** point users to `docs/USER_GUIDE.md` §6 for the three supported providers.
2. **CORS policy:** OpenAI-compatible endpoints that block browsers need `VITE_AI_BASE_URL`. If you run a relay, keep it HTTPS and key-free (keys travel from browser to provider directly).
3. **Content policy:** the assistant rewrites README text only; uploaded source is never transmitted. No PII of users is sent to AI providers by the app itself.
4. **Cost control:** because keys are user-held, provider spend is the user's, not the operator's.

## 5. Security Checklist

| Item | Status (v2.0.1) | Action |
| --- | --- | --- |
| CSP/security headers on production | Recommended | Add headers (see DEPLOYMENT.md §9) |
| No secrets in `VITE_*` env | ⚠️ | Never ship real keys in `.env.local` (bundled publicly) |
| Mermaid `securityLevel: 'strict'` | ✅ | Do not downgrade |
| Markdown HTML escaping | ✅ | Default react-markdown behavior; keep it |
| `x-powered-by` disabled | ✅ | Already in `server.ts` |
| Firebase domain allow-list | ✅ required | Recheck on every new host |
| Dependency audit | Periodic | `npm audit` in CI |
| `@google/genai` unused | ⚠️ | Remove when convenient (`npm uninstall @google/genai`) |

## 6. Monitoring & Alerting

| Signal | Source | Alert on |
| --- | --- | --- |
| Liveness | `/api/health` (UptimeRobot/Pingdom) | non-200 or `status != ok` for 2+ min |
| Auth failures spike | Firebase Console | — |
| Build failure | CI | red pipeline |
| Client JS errors | Browser console / Sentry | uncaught exceptions |
| Storage usage | Firebase/console | quota warnings (minimal usage expected) |

## 7. User Support Playbook

| Ticket | Likely cause | Resolution |
| --- | --- | --- |
| "Sign-in not authorized on this domain" | Domain missing from authorized domains | Add domain in Firebase console |
| "Popup blocked" | iframe/preview sandbox | Use email/password; document it |
| "Upload too large" | 60 MB total / 10 MB file caps | Split the archive, exclude `node_modules` |
| "AI won't connect" | Provider CORS / wrong key | Verify key, set base URL, check provider status |
| "Diagram shows error" | Mermaid parse failure beyond repair | Regenerate diagrams; report with console log |
| "Theme stuck" | `localStorage` blocked | Allow storage; hard-refresh |

## 8. Release Management

- **Versioning:** semver (`MAJOR.MINOR.PATCH`); changelog maintained in `docs/CHANGELOG.md`.
- **Pre-release checklist:** `npm run lint` → `npm run build` → manual matrix (TESTING.md §4, M7/M9/M12/M15 minimum) → auth domain check → health check post-deploy.
- **Rollback policy:** any regression in the generation pipeline (M7–M11) triggers rollback to the previous tag.
