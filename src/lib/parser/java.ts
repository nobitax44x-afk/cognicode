import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, stripComments, type PropertyInfo } from './helpers';

export function parseJava(path: string, content: string, isKotlin: boolean): ParseResult {
  const text = stripComments(content, 'java');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const pkgRe = /^\s*package\s+([\w.]+)\s*;/m;
  const packageName = pkgRe.exec(text)?.[1];

  const importRe = isKotlin ? /^\s*import\s+([\w.*]+)/gm : /^\s*import\s+(?:static\s+)?([\w.*]+)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(text))) addUnique(result.imports, m[1]);

  if (isKotlin) {
    parseKotlinTypes(text, result, packageName);
  } else {
    parseJavaTypes(text, result, packageName);
  }

  result.imports = dedupe(result.imports);
  return result;
}

function parseJavaTypes(text: string, result: ParseResult, packageName?: string): void {
  const typeRe = /(?:^|\n)\s*(?:public|protected|private|static|final|abstract|@\w+)?\s*(?:public|protected|private|static|final|abstract|@\w+)?\s*(class|interface|enum)\s+(\w+)/g;
  let m: RegExpExecArray | null;
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

    const ext = /(?:^|\s)extends\s+([\w$.]+)/.exec(header);
    const impl = /(?:^|\s)implements\s+([^{]+)/.exec(header);
    const implementsList = impl
      ? impl[1]
          .split(',')
          .map((x) => x.trim().replace(/<.*/, '').replace(/^[\w$.]+\./, ''))
          .filter((x) => /^\w+$/.test(x))
      : [];

    if (kind === 'enum') {
      const members: PropertyInfo[] = body
        .split('\n')
        .map((l) => /^\s*(\w+)\s*(?:\(|,|;|$)/.exec(l)?.[1])
        .filter((x): x is string => Boolean(x) && x !== 'private' && x !== 'public')
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
      superclass: kind === 'class' ? ext?.[1]?.replace(/^[\w$.]+\./, '') : undefined,
      implements: kind === 'class' ? implementsList : [],
      methods: [],
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    };

    parseJavaBody(body, symbol, kind === 'interface');
    if (/^\s*public/.test(text.slice(Math.max(0, m.index - 20), m.index))) addUnique(result.exports, name);
    result.symbols.push(symbol);
  }
}

function parseJavaBody(body: string, symbol: ParsedSymbol, isInterface: boolean): void {
  const lines = body.split('\n');
  let depth = 0;
  const fieldRe =
    /^((?:(?:public|protected|private|static|final|abstract|transient|volatile|synchronized)\s+)+)?([\w$.<>\[\],]+?)\s+([a-zA-Z_$][\w$]*)\s*(?:=|;|$)/;
  const methodRe =
    /^((?:(?:public|protected|private|static|final|abstract|synchronized|native|default)\s+)+)?([\w$.<>\[\],]+?)\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,.]+)?\s*\{?/;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const open = (line.match(/{/g) ?? []).length;
    const close = (line.match(/}/g) ?? []).length;
    if (depth === 0) {
      const fm = methodRe.exec(line);
      if (fm && !/\b(if|for|while|switch|catch|return|new)\b/.test(fm[3] ?? '')) {
        const name = fm[3];
        const type = fm[2].trim();
        if (type && !type.includes('(') && name !== 'main' && symbol.methods.length < 16) {
          const vis = /private/.test(fm[1] ?? '') ? '-' : /protected/.test(fm[1] ?? '') ? '#' : '+';
          symbol.methods.push({
            name,
            params: splitJavaParams(fm[4]),
            visibility: vis,
            kind: 'method',
          });
        }
        depth += open - close;
        continue;
      }
      const fld = fieldRe.exec(line);
      if (fld && !isInterface) {
        const name = fld[3];
        const type = fld[2].trim();
        if (
          type &&
          !type.includes('(') &&
          !/^(if|for|while|return|new|this|throw|switch|case|class|interface|public|private|protected|static)$/.test(name) &&
          symbol.properties.length < 14 &&
          !symbol.properties.some((p) => p.name === name)
        ) {
          const vis = /private/.test(fld[1] ?? '') ? '-' : /protected/.test(fld[1] ?? '') ? '#' : '+';
          symbol.properties.push({ name, type: type.slice(0, 20), visibility: vis });
        }
      }
    }
    depth += open - close;
  }
}

function splitJavaParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const t = p.trim().split(/\s+/);
      return t[t.length - 1] ?? '';
    })
    .filter((p) => p && p !== '...' && !p.startsWith('@'))
    .slice(0, 5);
}

function parseKotlinTypes(text: string, result: ParseResult, packageName?: string): void {
  const typeRe = /(?:^|\n)\s*(?:public|internal|private|protected|abstract|data|sealed|enum|annotation|value)\s+(?:public|internal|private|protected|abstract|data|sealed|enum|annotation|value)?\s*(?:class|interface|enum\s+class|object)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = typeRe.exec(text))) {
    const name = m[1];
    const header = text.slice(m.index, m.index + 500);
    const open = header.indexOf('{');
    const abs = m.index + (open >= 0 ? open : 0);
    const close = open >= 0 ? findMatchingBrace(text, abs) : -1;
    const body = close >= 0 ? text.slice(abs + 1, close) : '';
    const headerBody = header.slice(0, open >= 0 ? open : header.length);

    const colonIdx = headerBody.indexOf(':');
    let superclass: string | undefined;
    const implementsList: string[] = [];
    if (colonIdx >= 0) {
      const bases = headerBody.slice(colonIdx + 1).split(',');
      const cleaned = bases.map((b) => b.trim().replace(/<.*/, '').replace(/\(.*/, '').replace(/^[\w$.]+\./, '')).filter((b) => /^\w+$/.test(b));
      superclass = cleaned[0];
      implementsList.push(...cleaned.slice(1));
    }

    const primaryProps: PropertyInfo[] = [];
    const primaryRe = /(?:val|var)\s+([A-Za-z_$][\w$]*)\s*:\s*([\w$.<>\[\], ]+?)\s*[=(]?/g;
    let pm: RegExpExecArray | null;
    while ((pm = primaryRe.exec(headerBody))) {
      primaryProps.push({
        name: pm[1],
        type: pm[2].trim().replace(/\s+/g, ''),
        visibility: /private/.test(pm[0]) ? '-' : /protected/.test(pm[0]) ? '#' : '+',
      });
    }

    const isEnum = /enum/.test(headerBody) || m[0].includes('enum');
    if (isEnum) {
      const members: PropertyInfo[] = body
        .split('\n')
        .map((l) => /^\s*([A-Z_]\w*)\s*[,(]/.exec(l)?.[1])
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
      kind: /interface/.test(m[0]) ? 'interface' : 'class',
      superclass: /interface/.test(m[0]) ? superclass : superclass,
      implements: implementsList,
      methods: [],
      properties: primaryProps,
      line: text.slice(0, m.index).split('\n').length,
    };

    const funRe = /fun\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = funRe.exec(body)) && symbol.methods.length < 16) {
      const name = fm[1];
      if (name === 'main') continue;
      const prefix = body.slice(Math.max(0, fm.index - 60), fm.index);
      symbol.methods.push({
        name,
        params: splitKotlinParams(fm[2]),
        visibility: /private\b/.test(prefix) ? '-' : /protected\b/.test(prefix) ? '#' : '+',
        kind: 'method',
      });
    }

    const propRe = /(?:val|var)\s+([A-Za-z_$][\w$]*)\s*:\s*([\w$.<>\[\], ]+?)\s*[=;]?$/gm;
    while ((pm = propRe.exec(body)) && symbol.properties.length < 14) {
      if (!symbol.properties.some((p) => p.name === pm[1])) {
        symbol.properties.push({
          name: pm[1],
          type: pm[2].trim().replace(/\s+/g, ''),
          visibility: /private/.test(pm[0]) ? '-' : '+',
        });
      }
    }

    result.symbols.push(symbol);
  }
}

function splitKotlinParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const m = /([A-Za-z_$][\w$]*)\s*:/.exec(p.trim());
      return m?.[1] ?? '';
    })
    .filter((p) => p && p !== '_')
    .slice(0, 5);
}
