import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, stripComments, type PropertyInfo } from './helpers';

export function parseRust(path: string, content: string): ParseResult {
  const text = stripComments(content, 'rs');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const useRe = /use\s+([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = useRe.exec(text))) {
    const path0 = m[1].trim().replace(/\bas\s+\w+$/, '').replace(/::\{.*\}$/, '');
    const first = path0.split('::')[0] ?? path0;
    if (first === 'crate' || first === 'self' || first === 'super' || first === 'crate::' || first === '::') {
      addUnique(result.imports, path0);
    } else if (!['std', 'core', 'alloc', 'serde', 'tokio', 'reqwest', 'anyhow', 'thiserror', 'log', 'tracing'].includes(first)) {
      addUnique(result.imports, path0);
    }
  }

  const modRe = /^pub(?:\([^)]*\))?\s+mod\s+(\w+)\s*;/gm;
  while ((m = modRe.exec(text))) addUnique(result.imports, `mod::${m[1]}`);

  const structRe = /pub(?:\([^)]*\))?\s+struct\s+(\w+)(?:\s*<[^>]*>)?\s*\{/g;
  while ((m = structRe.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(text, open);
    const body = close >= 0 ? text.slice(open + 1, close) : '';
    result.symbols.push({
      name: m[1],
      kind: 'struct',
      superclass: undefined,
      implements: [],
      methods: [],
      properties: parseRustFields(body),
      line: text.slice(0, m.index).split('\n').length,
    });
  }

  const enumRe = /pub(?:\([^)]*\))?\s+enum\s+(\w+)\s*\{/g;
  while ((m = enumRe.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(text, open);
    const body = close >= 0 ? text.slice(open + 1, close) : '';
    const members: PropertyInfo[] = body
      .split('\n')
      .map((l) => /^\s*(\w+)/.exec(l)?.[1])
      .filter((x): x is string => Boolean(x))
      .slice(0, 14)
      .map((name) => ({ name, visibility: '+' }));
    result.symbols.push({
      name: m[1],
      kind: 'enum',
      superclass: undefined,
      implements: [],
      methods: [],
      properties: members,
      line: text.slice(0, m.index).split('\n').length,
    });
  }

  const traitRe = /pub(?:\([^)]*\))?\s+trait\s+(\w+)/g;
  while ((m = traitRe.exec(text))) {
    const header = text.slice(m.index, m.index + 300);
    const open = header.indexOf('{');
    const abs = m.index + (open >= 0 ? open : 0);
    const close = open >= 0 ? findMatchingBrace(text, abs) : -1;
    const body = close >= 0 ? text.slice(abs + 1, close) : '';
    result.symbols.push({
      name: m[1],
      kind: 'trait',
      superclass: undefined,
      implements: [],
      methods: body
        .split('\n')
        .map((l) => /^\s*fn\s+(\w+)/.exec(l)?.[1])
        .filter((x): x is string => Boolean(x))
        .map((name) => ({ name, params: [], visibility: '+', kind: 'method' as const })),
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    });
  }

  const implRe = /impl(?:<[^>]*>)?\s+(?:\w+::)*([A-Z]\w*)\s+for\s+(\w+)/g;
  while ((m = implRe.exec(text))) {
    const symbol = result.symbols.find((s) => s.name === m[2]);
    if (symbol) addUnique(symbol.implements, m[1]);
  }

  const implBlockRe = /impl\s+(?:\w+::)*(\w+)\s*\{/g;
  while ((m = implBlockRe.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(text, open);
    const body = close >= 0 ? text.slice(open + 1, close) : '';
    const symbol = result.symbols.find((s) => s.name === m[1]);
    if (!symbol) continue;
    const fnRe = /fn\s+(\w+)\s*\(([^)]*)\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fnRe.exec(body)) && symbol.methods.length < 16) {
      if (fm[1] === 'new' || fm[1] === 'default') continue;
      symbol.methods.push({
        name: fm[1],
        params: rustParams(fm[2]),
        visibility: /^\s*pub/.test(body.slice(Math.max(0, fm.index - 20), fm.index)) ? '+' : '-',
        kind: 'method',
      });
    }
  }

  result.imports = dedupe(result.imports);
  return result;
}

function parseRustFields(body: string): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('//')) continue;
    const field = /^pub(?:\([^)]*\))?\s+(\w+)\s*:\s*([^,]+?)\s*[,=]?$/.exec(t);
    if (field) {
      props.push({
        name: field[1],
        type: field[2].trim().replace(/\s+/g, ''),
        visibility: '+',
      });
    }
  }
  return props.slice(0, 14);
}

function rustParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const parts = p.trim().split(/\s*:\s*/);
      return parts[0]?.trim() ?? '';
    })
    .filter((p) => p && p !== 'self' && p !== '&self' && p !== '&mut self')
    .slice(0, 5);
}
