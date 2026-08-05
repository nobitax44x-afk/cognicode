import type { Theme } from '../hooks/useTheme';
import { mermaidThemeVariables } from './mermaidTheme';
import { repairMermaid, tryParseMermaid } from './mermaidRepair';

let mermaidPromise: Promise<typeof import('mermaid')> | null = null;
let lastTheme: Theme | null = null;
const cache = new Map<string, Promise<string>>();
let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid');
  }
  return mermaidPromise;
}

export function warmUpMermaid(): void {
  void loadMermaid();
}

async function initializeMermaid(theme: Theme): Promise<void> {
  const { default: mermaid } = await loadMermaid();
  if (lastTheme === theme) return;
  lastTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: mermaidThemeVariables(theme),
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
      nodeSpacing: 60,
      rankSpacing: 85,
      padding: 18,
    },
    sequence: {
      useMaxWidth: false,
      actorMargin: 110,
      boxMargin: 14,
      messageMargin: 70,
      boxTextMargin: 10,
      noteMargin: 14,
    },
    class: {
      useMaxWidth: false,
      padding: 20,
    },
    er: {
      useMaxWidth: false,
      entityPadding: 18,
      minEntityWidth: 140,
      minEntityHeight: 60,
    },
    state: {
      useMaxWidth: false,
    },
  });
}

export function renderMermaidCached(source: string, theme: Theme): Promise<string> {
  const key = `${theme}\u0000${source}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const pending = (async () => {
    await initializeMermaid(theme);
    const parsed = await tryParseMermaid(source);
    let finalSource = source;
    if (!parsed.ok) {
      const candidates = repairMermaid(source, parsed.line);
      let repaired: string | null = null;
      for (const cand of candidates) {
        if (cand === source) continue;
        const r = await tryParseMermaid(cand);
        if (r.ok) {
          repaired = cand;
          break;
        }
      }
      if (repaired) {
        finalSource = repaired;
        console.warn('[cognicode:mermaid] repaired invalid diagram:', parsed.error);
      } else {
        throw new Error(`Mermaid parse error: ${parsed.error}`);
      }
    }
    return renderRaw(finalSource, theme);
  })();
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  return pending;
}

async function renderRaw(source: string, theme: Theme): Promise<string> {
  await initializeMermaid(theme);
  const { default: mermaid } = await loadMermaid();
  return enqueue(async () => {
    const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const { svg } = await mermaid.render(id, source);
    return svg;
  });
}

export function clearMermaidCache(): void {
  cache.clear();
}
