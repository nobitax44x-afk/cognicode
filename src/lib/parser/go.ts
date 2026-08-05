import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, stripComments, type PropertyInfo } from './helpers';

export function parseGo(path: string, content: string): ParseResult {
  const text = stripComments(content, 'go');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };
  const lines = text.split('\n');

  const pkgRe = /^package\s+(\w+)/.exec(text);
  const pkgName = pkgRe?.[1];

  const importBlock = /import\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = importBlock.exec(text))) {
    for (const line of m[1].split('\n')) {
      const quoted = /"([^"]+)"/.exec(line.trim());
      if (quoted) addUnique(result.imports, quoted[1]);
    }
  }
  const importSingle = /import\s+"([^"]+)"/g;
  while ((m = importSingle.exec(text))) addUnique(result.imports, m[1]);

  const typeRe = /type\s+(\w+)\s+(struct|interface)\s*\{/g;
  while ((m = typeRe.exec(text))) {
    const kind = m[2];
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(text, open);
    const body = close >= 0 ? text.slice(open + 1, close) : '';
    const symbol: ParsedSymbol = {
      name: m[1],
      kind: kind === 'struct' ? 'struct' : 'interface',
      superclass: undefined,
      implements: [],
      methods: [],
      properties: parseGoFields(body, kind),
      line: text.slice(0, m.index).split('\n').length,
    };
    result.symbols.push(symbol);
    if (/^\w/.test(m[1])) addUnique(result.exports, m[1]);
  }

  const funcRe = /func\s+\(([^)]*)\)\s*(\w+)\s*\(([^)]*)\)/g;
  while ((m = funcRe.exec(text))) {
    const receiver = m[1].trim();
    const rc = /(?:\*?)(\w+)/.exec(receiver)?.[1];
    if (!rc) continue;
    const symbol = result.symbols.find((s) => s.name === rc);
    if (!symbol || symbol.kind !== 'struct') continue;
    if (symbol.methods.length >= 16) continue;
    symbol.methods.push({
      name: m[2],
      params: goParams(m[3]),
      visibility: /^\w/.test(m[2]) ? '+' : '-',
      kind: 'method',
    });
  }

  result.imports = dedupe(result.imports);
  return result;
}

function parseGoFields(body: string, kind: string): PropertyInfo[] {
  if (kind === 'interface') return [];
  const props: PropertyInfo[] = [];
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('//')) continue;
    const field = /^(\w+)\s+([\w*.\[\]\s]+)(?:\s+`[^`]*`)?$/.exec(t);
    if (field && !/\bmap\b|\bchan\b/.test(t)) {
      props.push({
        name: field[1],
        type: field[2].trim().replace(/\s+/g, ''),
        visibility: /^\w/.test(field[1]) ? '+' : '-',
      });
    }
  }
  return props.slice(0, 14);
}

function goParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      return parts[0] ?? '';
    })
    .filter((p) => p && p !== '_' && p !== '...any')
    .slice(0, 5);
}
