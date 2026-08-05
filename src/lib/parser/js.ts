import type { ParseResult, ParsedSymbol } from './helpers';
import {
  addUnique,
  dedupe,
  findMatchingBrace,
  parseBraceClassBody,
  stripComments,
  type MethodInfo,
  type PropertyInfo,
} from './helpers';

function collectImports(text: string, imports: string[]): void {
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[\w$*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bexport\s+\*\s+from\s+['"]([^'"]+)['"]/g,
    /\bexport\s+\{\s*[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
    /\blazy\s*\(\s*\(\)\s*=>\s*(?:import|require)\s*\(\s*['"]([^'"]+)['"]/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) addUnique(imports, m[1]);
  }
}

function collectExports(text: string, exports: string[]): void {
  const re =
    /\bexport\s+(?:default\s+)?(?:abstract\s+)?(?:class|function|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) addUnique(exports, m[1]);
  const brace = /\bexport\s+\{\s*([^}]*)\s*\}/g;
  while ((m = brace.exec(text))) {
    for (const part of m[1].split(',')) {
      const name = /([A-Za-z_$][\w$]*)/.exec(part.trim())?.[1];
      if (name) addUnique(exports, name);
    }
  }
  const defaultRe = /\bexport\s+default\s+([A-Za-z_$][\w$]*)/g;
  while ((m = defaultRe.exec(text))) addUnique(exports, `default:${m[1]}`);
}

function headerInfo(header: string): { superclass?: string; implements: string[] } {
  const ext = /\bextends\s+([A-Za-z_$][\w$.]*(?:<[^;{]*>)?)/.exec(header);
  const impl = /\bimplements\s+([^{]+)/.exec(header);
  const clean = (s: string) => s.replace(/<.*/, '').trim().replace(/^[\w$.]+\./, '');
  const implementsList = impl
    ? impl[1]
        .split(',')
        .map((x) => clean(x))
        .filter((x) => x && !x.includes('{') && !x.includes('(') && !x.includes(';'))
    : [];
  return {
    superclass: ext ? clean(ext[1]) : undefined,
    implements: implementsList,
  };
}

function parseEnum(text: string, offset: number, result: ParseResult): void {
  const enumRe = /(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)\s*\{/g;
  enumRe.lastIndex = offset;
  const m = enumRe.exec(text);
  if (!m) return;
  const open = m.index + m[0].length - 1;
  const close = findMatchingBrace(text, open);
  const body = close >= 0 ? text.slice(open + 1, close) : '';
  const members: PropertyInfo[] = body
    .split(',')
    .map((part) => /([A-Za-z_$][\w$]*)/.exec(part.trim())?.[1])
    .filter((x): x is string => Boolean(x) && !RESERVED_NAMES.has(x))
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

function parseInterface(text: string, offset: number, result: ParseResult): void {
  const intRe = /(?:export\s+)?(?:declare\s+)?interface\s+([A-Za-z_$][\w$]*)/g;
  intRe.lastIndex = offset;
  const m = intRe.exec(text);
  if (!m) return;
  const header = text.slice(m.index, m.index + 400);
  const info = headerInfo(header);
  const open = header.indexOf('{');
  const abs = m.index + (open >= 0 ? open : 0);
  const close = open >= 0 ? findMatchingBrace(text, abs) : -1;
  const body = close >= 0 ? text.slice(abs + 1, close) : '';
  const members = parseBraceClassBody(body);
  const resultSymbol: ParsedSymbol = {
    name: m[1],
    kind: 'interface',
    superclass: info.superclass,
    implements: info.implements,
    methods: members.methods.map((mm: MethodInfo) => ({ ...mm })),
    properties: members.properties.map((pp: PropertyInfo) => ({ ...pp })),
    line: text.slice(0, m.index).split('\n').length,
  };
  result.symbols.push(resultSymbol);
}

export function parseJs(path: string, content: string): ParseResult {
  const text = stripComments(content, 'js');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };
  collectImports(text, result.imports);
  result.imports = dedupe(result.imports);
  collectExports(text, result.exports);

  const declRe =
    /(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g;
  let dm: RegExpExecArray | null;
  while ((dm = declRe.exec(text))) {
    const header = text.slice(dm.index, dm.index + 500);
    const open = header.indexOf('{');
    if (open < 0) continue;
    const abs = dm.index + open;
    const close = findMatchingBrace(text, abs);
    if (close < 0) continue;
    const body = text.slice(abs + 1, close);
    const info = headerInfo(header);
    const members = parseBraceClassBody(body);
    result.symbols.push({
      name: dm[1],
      kind: 'class',
      superclass: info.superclass,
      implements: info.implements,
      methods: members.methods,
      properties: members.properties,
      line: text.slice(0, dm.index).split('\n').length,
    });
  }

  const intRe = /(?:export\s+)?(?:declare\s+)?interface\s+([A-Za-z_$][\w$]*)/g;
  let im: RegExpExecArray | null;
  while ((im = intRe.exec(text))) parseInterface(text, im.index, result);

  const enumRe = /(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/g;
  let em: RegExpExecArray | null;
  while ((em = enumRe.exec(text))) parseEnum(text, em.index, result);

  return result;
}

const RESERVED_NAMES = new Set(['true', 'false', 'null', 'undefined', 'import', 'export']);
