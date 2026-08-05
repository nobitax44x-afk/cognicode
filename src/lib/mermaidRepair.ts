export function safeId(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export function quote(label: string): string {
  const escaped = label
    .replace(/["[\]<>{}`]/g, '')
    .replace(/\r?\n/g, ' ')
    .trim();
  return `"${escaped}"`;
}

export type ParseOutcome = { ok: true } | { ok: false; error: string; line?: number };

let mermaidModule: Promise<typeof import('mermaid')> | null = null;

async function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidModule) mermaidModule = import('mermaid');
  return mermaidModule;
}

export async function tryParseMermaid(source: string): Promise<ParseOutcome> {
  try {
    const { default: mermaid } = await loadMermaid();
    await mermaid.parse(source);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const lineMatch = /line (\d+)/i.exec(error);
    return {
      ok: false,
      error,
      line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
    };
  }
}

export function repairMermaid(source: string, hint?: number): string[] {
  const strategies: Array<() => string> = [];

  strategies.push(() => {
    const lines = source.split('\n');
    if (hint && hint > 0 && hint <= lines.length) {
      return lines.filter((_, i) => i !== hint - 1).join('\n');
    }
    throw new Error('no line hint');
  });

  strategies.push(() =>
    source
      .split('\n')
      .filter((l) => !/^\s*(class|interface|enum|state|flowchart|sequenceDiagram|erDiagram|classDiagram)\s+[\w]*\s*\{\s*$/.test(l))
      .join('\n'),
  );

  strategies.push(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of source.split('\n')) {
      const key = line.replace(/\s+/g, ' ').trim();
      if (seen.has(key) && /^\s*[A-Za-z_][\w]*\s*-->\s*/.test(line)) continue;
      seen.add(key);
      out.push(line);
    }
    return out.join('\n');
  });

  strategies.push(() => source.replace(/\s+/g, ' '));

  return strategies.map((s) => {
    try {
      return s();
    } catch {
      return source;
    }
  });
}
