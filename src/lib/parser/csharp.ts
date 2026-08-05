import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, stripComments, type PropertyInfo } from './helpers';

export function parseCsharp(path: string, content: string): ParseResult {
  const text = stripComments(content, 'cs');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const usingRe = /^\s*using\s+([\w.]+)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = usingRe.exec(text))) addUnique(result.imports, m[1]);

  const typeRe = /(?:^|\n)\s*(?:(?:public|internal|private|protected|static|partial|abstract|sealed|readonly)\s+)*(?:class|interface|enum|struct|record)\s+(\w+)/g;
  const ifaces = new Set<string>();
  for (const t of text.matchAll(/\binterface\s+(\w+)/g)) ifaces.add(t[1]);
  for (const t of text.matchAll(/\benum\s+(\w+)/g)) ifaces.add(t[1]);

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

    const bases = (headerBody.split(':')[1] ?? '')
      .split(',')
      .map((b) => b.trim().replace(/<.*/, '').replace(/^[\w$.]+\./, ''))
      .filter((b) => /^\w+$/.test(b) && !b.includes('('));
    let superclass: string | undefined;
    const implementsList: string[] = [];
    for (const b of bases) {
      if (!superclass && !ifaces.has(b)) superclass = b;
      else implementsList.push(b);
    }
    if (!superclass && implementsList.length > 0) {
      superclass = undefined;
    }

    if (kind === 'enum') {
      const members: PropertyInfo[] = body
        .split('\n')
        .map((l) => /^\s*(\w+)\s*(?:=|,|$)/.exec(l)?.[1])
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
      kind: kind === 'interface' ? 'interface' : kind === 'struct' ? 'struct' : 'class',
      superclass,
      implements: implementsList,
      methods: [],
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    };
    parseCsharpBody(body, symbol, kind === 'interface');
    result.symbols.push(symbol);
  }

  result.imports = dedupe(result.imports);
  return result;
}

function parseCsharpBody(body: string, symbol: ParsedSymbol, isInterface: boolean): void {
  const lines = body.split('\n');
  let depth = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const open = (line.match(/{/g) ?? []).length;
    const close = (line.match(/}/g) ?? []).length;

    if (depth === 0) {
      const methodRe =
        /^((?:(?:public|protected|private|internal|static|virtual|abstract|async|override|sealed|new)\s+)+)?([\w$.<>\[\],]+?)\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)\s*(?::[^{]*)?\{?/;
      const fm = methodRe.exec(line);
      if (fm) {
        const name = fm[3];
        const type = fm[2].trim();
        if (type && !type.includes('(') && name !== 'Main' && symbol.methods.length < 16) {
          const vis = /private/.test(fm[1] ?? '') ? '-' : /protected/.test(fm[1] ?? '') ? '#' : '+';
          symbol.methods.push({
            name,
            params: splitCsharpParams(fm[4]),
            visibility: vis,
            kind: name === name[0]?.toLowerCase() ? 'method' : 'method',
          });
        }
        depth += open - close;
        continue;
      }
      const propRe =
        /^((?:(?:public|protected|private|internal|static|virtual|abstract|override|readonly|required)\s+)+)?([\w$.<>\[\],]+?)\s+([a-zA-Z_$][\w$]*)\s*\{\s*get/;
      const fp = propRe.exec(line);
      if (fp && symbol.properties.length < 14) {
        const vis = /private/.test(fp[1] ?? '') ? '-' : /protected/.test(fp[1] ?? '') ? '#' : '+';
        if (!symbol.properties.some((p) => p.name === fp[3])) {
          symbol.properties.push({ name: fp[3], type: fp[2].trim(), visibility: vis });
        }
      }
      const fieldRe =
        /^((?:(?:public|protected|private|internal|static|readonly|const)\s+)+)?([\w$.<>\[\],]+?)\s+([a-zA-Z_$][\w$]*)\s*[;=]/;
      const ff = fieldRe.exec(line);
      if (ff && !fp && symbol.properties.length < 14) {
        const vis = /private/.test(ff[1] ?? '') ? '-' : /protected/.test(ff[1] ?? '') ? '#' : '+';
        if (!symbol.properties.some((p) => p.name === ff[3])) {
          symbol.properties.push({ name: ff[3], type: ff[2].trim(), visibility: vis });
        }
      }
    }
    depth += open - close;
  }
}

function splitCsharpParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const parts = p.trim().split(/\s+/);
      return parts[parts.length - 1] ?? '';
    })
    .filter((p) => p && p !== 'this' && !p.startsWith('@'))
    .slice(0, 5);
}
