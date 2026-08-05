import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, findMatchingBrace, parseBraceClassBody, stripComments, type PropertyInfo } from './helpers';

export function parseCpp(path: string, content: string): ParseResult {
  const text = stripComments(content, 'cpp');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const includeRe = /#include\s*[<"]([^>"]+)[>"]/g;
  let m: RegExpExecArray | null;
  while ((m = includeRe.exec(text))) addUnique(result.imports, m[1]);

  const typeRe = /(?:^|\n)\s*(?:typedef\s+)?(class|struct|enum)\s+(\w+)\s*(?::\s*(?:public|protected|private)\s+(\w+))?/g;
  const enumNames = new Set<string>();
  while ((m = typeRe.exec(text))) {
    if (m[1] === 'enum') {
      enumNames.add(m[2]);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 400);
      const body = after.slice(0, after.indexOf(';'));
      const members: PropertyInfo[] = body
        .split(',')
        .map((l) => /(\w+)\s*(?:=|$)/.exec(l.trim())?.[1])
        .filter((x): x is string => Boolean(x))
        .slice(0, 14)
        .map((n) => ({ name: n, visibility: '+' }));
      result.symbols.push({
        name: m[2],
        kind: 'enum',
        superclass: undefined,
        implements: [],
        methods: [],
        properties: members,
        line: text.slice(0, m.index).split('\n').length,
      });
      continue;
    }
    const open = text.indexOf('{', m.index + m[0].length);
    if (open < 0) {
      result.symbols.push({
        name: m[2],
        kind: m[1] === 'struct' ? 'struct' : 'class',
        superclass: m[3],
        implements: [],
        methods: [],
        properties: [],
        line: text.slice(0, m.index).split('\n').length,
      });
      continue;
    }
    const close = findMatchingBrace(text, open);
    const body = close >= 0 ? text.slice(open + 1, close) : '';
    const members = parseBraceClassBody(body);
    result.symbols.push({
      name: m[2],
      kind: m[1] === 'struct' ? 'struct' : 'class',
      superclass: m[3],
      implements: [],
      methods: members.methods,
      properties: members.properties,
      line: text.slice(0, m.index).split('\n').length,
    });
  }

  const methodRe = /([\w:~]+)::(\w+)\s*\(([^)]*)\)/g;
  while ((m = methodRe.exec(text))) {
    const clsName = m[1].split('::').pop() ?? '';
    const symbol = result.symbols.find((s) => s.name === clsName);
    if (!symbol) continue;
    const prefix = text.slice(Math.max(0, m.index - 60), m.index);
    if (symbol.methods.length >= 16) continue;
    symbol.methods.push({
      name: m[2],
      params: splitCppParams(m[3]),
      visibility: /^\s*(public|private|protected)\s*:/.test(prefix) ? '+' : /private:/.test(prefix) ? '-' : /protected:/.test(prefix) ? '#' : '+',
      kind: 'method',
    });
  }

  result.imports = dedupe(result.imports);
  return result;
}

function splitCppParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const m = /([\w:]+)\s*(?:=|$)/.exec(p.trim());
      return m?.[1]?.split('::').pop() ?? '';
    })
    .filter((p) => p && p !== 'void' && p !== '...')
    .slice(0, 5);
}

export function parseRuby(path: string, content: string): ParseResult {
  const text = stripComments(content, 'rb');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };
  const lines = text.split('\n');

  for (const line of lines) {
    const t = line.trim();
    const req = /^require(?:_relative)?\s+['"]([^'"]+)['"]/.exec(t);
    if (req) {
      addUnique(result.imports, req[1]);
      continue;
    }
  }

  const stack: Array<{ symbol: ParsedSymbol; indent: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const t = line.trim();
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();

    const classRe = /^class\s+([\w:]+)\s*(?:<\s*([\w:]+))?/.exec(t);
    if (classRe) {
      const name = classRe[1].split('::').pop() ?? classRe[1];
      const symbol: ParsedSymbol = {
        name,
        kind: 'class',
        superclass: classRe[2]?.split('::').pop(),
        implements: [],
        methods: [],
        properties: [],
        line: i + 1,
      };
      stack.push({ symbol, indent });
      result.symbols.push(symbol);
      continue;
    }
    if (stack.length === 0) continue;
    const top = stack[stack.length - 1];
    const defRe = /^def\s+([\w]+[!?]?)\s*(?:\(([^)]*)\))?/.exec(t);
    if (defRe && top.symbol.methods.length < 16) {
      top.symbol.methods.push({
        name: defRe[1],
        params: defRe[2]
          ? defRe[2]
              .split(',')
              .map((p) => p.trim().split(/[=:]/)[0])
              .filter(Boolean)
              .slice(0, 5)
          : [],
        visibility: defRe[1].startsWith('_') ? '-' : '+',
        kind: 'method',
      });
      continue;
    }
    const attrRe = /^attr_(?:accessor|reader|writer)\s+((?::\w+(?:,\s*)?)+)/.exec(t);
    if (attrRe && top.symbol.properties.length < 14) {
      for (const name of attrRe[1].matchAll(/:(\w+)/g)) {
        if (!top.symbol.properties.some((p) => p.name === name[1])) {
          top.symbol.properties.push({ name: name[1], visibility: '+' });
        }
      }
    }
    const ivarRe = /^@(\w+)\s*[:=]/.exec(t);
    if (ivarRe && top.symbol.properties.length < 14) {
      if (!top.symbol.properties.some((p) => p.name === ivarRe[1])) {
        top.symbol.properties.push({ name: ivarRe[1], visibility: '#' });
      }
    }
  }

  result.imports = dedupe(result.imports);
  return result;
}

export function parseSwift(path: string, content: string): ParseResult {
  const text = stripComments(content, 'swift');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const importRe = /^\s*import\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(text))) addUnique(result.imports, m[1]);

  const typeRe = /(?:^|\n)\s*(?:public|internal|private|fileprivate|final|open|indirect)?\s*(?:class|struct|protocol|enum)\s+(\w+)/g;
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

    const colon = headerBody.indexOf(':');
    const bases = colon >= 0
      ? headerBody
          .slice(colon + 1)
          .split(',')
          .map((b) => b.trim().replace(/<.*/, ''))
          .filter((b) => /^\w+$/.test(b))
      : [];

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
      kind: kind === 'protocol' ? 'interface' : kind === 'struct' ? 'struct' : 'class',
      superclass: kind === 'class' ? bases[0] : undefined,
      implements: kind === 'class' ? bases.slice(1) : bases,
      methods: [],
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    };

    const bodyLines = body.split('\n');
    let depth = 0;
    for (const raw of bodyLines) {
      const line = raw.trim();
      if (!line) continue;
      const open2 = (line.match(/{/g) ?? []).length;
      const close2 = (line.match(/}/g) ?? []).length;
      if (depth === 0) {
        const fnRe = /(?:^|\s)func\s+(\w+)\s*\(([^)]*)\)/;
        const fm = fnRe.exec(line);
        if (fm && symbol.methods.length < 16) {
          symbol.methods.push({
            name: fm[1],
            params: splitSwiftParams(fm[2]),
            visibility: /private/.test(line) ? '-' : '+',
            kind: 'method',
          });
        }
        const propRe = /(?:^|\s)(var|let)\s+(\w+)\s*:\s*([\w$.<>\[\]]+)/;
        const fp = propRe.exec(line);
        if (fp && symbol.properties.length < 14) {
          const type = fp[3].trim();
          if (!['if', 'for', 'while', 'switch'].includes(fp[2]) && !type.includes('(')) {
            symbol.properties.push({
              name: fp[2],
              type: type.slice(0, 20),
              visibility: /private/.test(line) ? '-' : '+',
            });
          }
        }
      }
      depth += open2 - close2;
    }

    result.symbols.push(symbol);
  }

  result.imports = dedupe(result.imports);
  return result;
}

function splitSwiftParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const m = /(\w+)\s*:/.exec(p.trim());
      return m?.[1] ?? '';
    })
    .filter((p) => p && p !== '_')
    .slice(0, 5);
}

export function parseDart(path: string, content: string): ParseResult {
  const text = stripComments(content, 'dart');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };

  const importRe = /^\s*import\s+['"]([^'"]+)['"]/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(text))) addUnique(result.imports, m[1]);

  const typeRe = /(?:^|\n)\s*(?:abstract\s+|base\s+|sealed\s+)?(?:class|interface|enum|mixin)\s+(\w+)/g;
  while ((m = typeRe.exec(text))) {
    const name = m[1];
    const header = text.slice(m.index, m.index + 400);
    const open = header.indexOf('{');
    if (open < 0) continue;
    const abs = m.index + open;
    const close = findMatchingBrace(text, abs);
    const body = close >= 0 ? text.slice(abs + 1, close) : '';
    const headerBody = header.slice(0, open >= 0 ? open : header.length);

    const ext = /\bextends\s+(\w+)/.exec(headerBody);
    const impl = /\bimplements\s+([^{]+)/.exec(headerBody);
    const withClause = /\bwith\s+([^{]+)/.exec(headerBody);

    if (/enum/.test(m[0])) {
      const members: PropertyInfo[] = body
        .split('\n')
        .map((l) => /^\s*(\w+)\s*[,(]/.exec(l)?.[1])
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
      superclass: ext?.[1],
      implements: [
        ...(impl ? impl[1].split(',').map((x) => x.trim()).filter((x) => /^\w+$/.test(x)) : []),
        ...(withClause ? withClause[1].split(',').map((x) => x.trim()).filter((x) => /^\w+$/.test(x)) : []),
      ],
      methods: [],
      properties: [],
      line: text.slice(0, m.index).split('\n').length,
    };

    const bodyLines = body.split('\n');
    let depth = 0;
    for (const raw of bodyLines) {
      const line = raw.trim();
      if (!line) continue;
      const open2 = (line.match(/{/g) ?? []).length;
      const close2 = (line.match(/}/g) ?? []).length;
      if (depth === 0) {
        const fnRe = /^([\w$.<>\[\], ]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:async\*?)?\s*\{?/;
        const fm = fnRe.exec(line);
        if (fm) {
          const type = fm[1].trim();
          if (!type.includes('(') && symbol.methods.length < 16) {
            symbol.methods.push({
              name: fm[2],
              params: splitDartParams(fm[3]),
              visibility: /private/.test(line) ? '-' : '+',
              kind: 'method',
            });
          }
        }
        const propRe = /^(final\s+)?(?:var|final|const)\s+(\w+)\s*:\s*([\w$.<>\[\], ]+?)\s*[=;]/;
        const fp = propRe.exec(line);
        if (fp && symbol.properties.length < 14) {
          symbol.properties.push({
            name: fp[2],
            type: fp[3].trim().replace(/\s+/g, ''),
            visibility: /private/.test(fp[2]) ? '-' : '+',
          });
        }
      }
      depth += open2 - close2;
    }

    result.symbols.push(symbol);
  }

  result.imports = dedupe(result.imports);
  return result;
}

function splitDartParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => {
      const m = /(\w+)\s*:/.exec(p.trim());
      return m?.[1] ?? '';
    })
    .filter((p) => p && p !== '_' && !p.startsWith('this.'))
    .slice(0, 5);
}
