/**
 * CogniCode — production server
 * ------------------------------
 * Serves the built client bundle (`dist/`) with an SPA fallback so client-side
 * routes/anchors work on refresh, plus a minimal `/api/health` endpoint.
 *
 * Usage:
 *   - Development:  `npm run dev`  (tsx server.ts)  -> serves dist/ if present;
 *     for hot-reload during development use `vite` directly instead.
 *   - Production:   `npm run build && npm start`    -> node dist/server.cjs
 *
 * Environment variables (see .env.example):
 *   PORT        — port to listen on (default 3000)
 *   HOST        — bind address (default 0.0.0.0)
 *   NODE_ENV    — 'production' | 'development' (default production)
 */
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
const isProd = process.env.NODE_ENV !== 'development';

// dist/ lives next to the bundled server (dist/server.cjs) or at repo root
// when running via tsx.
const distCandidates = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '..', 'dist'),
];
const DIST_DIR = distCandidates.find((p) => fs.existsSync(path.join(p, 'index.html')));

const app = express();
app.disable('x-powered-by');

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cognicode',
    version: process.env.npm_package_version ?? '2.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

if (DIST_DIR) {
  app.use(express.static(DIST_DIR, { index: 'index.html', maxAge: '1h' }));
  // SPA fallback: serve index.html for any non-file request (deep links).
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[cognicode] serving static assets from ${DIST_DIR}`);
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text/plain')
      .send(
        'CogniCode server is running.\n\nNo build found in dist/. Run `npm run build` first, ' +
          'or use `vite` (npx vite) for the development server.\n',
      );
  });
}

app.listen(PORT, HOST, () => {
  console.log(
    `[cognicode] server listening on http://${HOST}:${PORT} (${isProd ? 'production' : 'development'})`,
  );
});
