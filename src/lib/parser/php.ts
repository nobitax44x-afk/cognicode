import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, stripComments, type PropertyInfo } from './helpers';

export function parsePhp(path: string, content: string): ParseResult {
  const text = stripComments(content, 'php');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const useRe = /^\s*use\s+([\\\w]+(?:\s+as\s+\w+)?)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = useRe.exec(text))) {
    const spec = m[1].split(/\s+as\s+/)[0].replace(/^\\/, '');
    addUnique(result.imports, spec);
  }

  const namespaceRe = /^\s*namespace\s+([\\\w]+)\s*;/m;
  const ns = namespaceRe.exec(text)?.[1]?.replace(/^\\/, '');

  const typeRe = /(?:^|\n)\s*(?:abstract|final)?\s*(?:class|interface|enum|trait)\s+(\w+)/g;
  while ((m = typeRe.exec(text))) {
    const kind = m[1];
    const name = m[2];
    const header = text.slice(m.index, m.index + 400);
    const open = header.indexOf('{');
    if (open < 0) continue;
    const abs = m.index + open;
    const close = findMatchingBrace(text, abs);
    const body = close >= 0 ? text.slice(abs + 1, close) : '';
    const headerBody = header.slice(0, open >= 0 ? open : header.length);

    const ext = /\bextends\s+([\\\w]+)/.exec(headerBody);
    const impl = /\bimplements\s+([^{]+)/.exec(headerBody);
    const clean = (s: string) => s.replace(/^\\/, '').split('\\').pop() ?? s;

    if (kind === 'enum') {
      const members: PropertyInfo[] = body
        .split('\n')
        .map((l) => /^\s*case\s+(\w+)/.exec(l)?.[1])
        .filter((x): x is string => Boolean(x))
        .slice(0, 14)
        .map((n) => ({ name: n, visibility: '+' }));
      result.symbols.push({
        name,
        kind: 'enum',
        superclass: undefined,
        implements: [],
        methods: [],
        properties: members,
        line: text.slice(0, m.index).split('\n').length,
      });
      continue;
    }

    const symbol: ParsedSymbol = {
      name,
      kind: kind === 'interface' ? 'interface' : 'class',
      superclass: ext ? clean(ext[1]) : undefined,
      implements: impl
        ? impl[1]
            .split(',')
            .map((x) => clean(x.trim()))
            .filter((x) => /^\w+$/.test(x))
        : [],
      methods: [],
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    };
    parsePhpBody(body, symbol, kind === 'interface');
    result.symbols.push(symbol);
  }

  result.imports = dedupe(result.imports);
  return result;
}

function parsePhpBody(body: string, symbol: ParsedSymbol, isInterface: boolean): void {
  const lines = body.split('\n');
  let depth = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const open = (line.match(/{/g) ?? []).length;
    const close = (line.match(/}/g) ?? []).length;

    if (depth === 0) {
      const fnRe = /^((?:(?:public|protected|private|static|abstract|final)\s+)*)function\s+(\w+)\s*\(([^)]*)\)/;
      const fm = fnRe.exec(line);
      if (fm && symbol.methods.length < 16) {
        const vis = /private/.test(fm[1] ?? '') ? '-' : /protected/.test(fm[1] ?? '') ? '#' : '+';
        symbol.methods.push({
          name: fm[2],
          params: splitPhpParams(fm[3]),
          visibility: vis,
          kind: 'method',
        });
        depth += open - close;
        continue;
      }
      const propRe = /^((?:(?:public|protected|private|static)\s+)*)\$(\w+)\s*(?:=|;|$)/;
      const fp = propRe.exec(line);
      if (fp && symbol.properties.length < 14) {
        const vis = /private/.test(fp[1] ?? '') ? '-' : /protected/.test(fp[1] ?? '') ? '#' : '+';
        if (!symbol.properties.some((p) => p.name === fp[2])) {
          symbol.properties.push({ name: fp[2], visibility: vis });
        }
      }
    }
    depth += open - close;
  }
}

function splitPhpParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const m = /\$(\w+)/.exec(p.trim());
      return m?.[1] ?? '';
    })
    .filter((p) => p && p !== 'this')
    .slice(0, 5);
}
