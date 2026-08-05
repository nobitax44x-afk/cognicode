import type { MethodInfo, PropertyInfo, SymbolKind } from '../../types';

export type { MethodInfo, PropertyInfo, SymbolKind };

export interface ParsedSymbol {
  name: string;
  kind: SymbolKind;
  superclass?: string;
  implements: string[];
  methods: MethodInfo[];
  properties: PropertyInfo[];
  line: number;
}

export interface ParseResult {
  imports: string[];
  exports: string[];
  symbols: ParsedSymbol[];
}

export interface ParserSpec {
  lang: string;
  parse: (path: string, content: string) => ParseResult;
}

export const RESERVED = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class',
  'constructor', 'let', 'const', 'var', 'import', 'export', 'async', 'await',
  'new', 'this', 'delete', 'typeof', 'instanceof', 'throw', 'try', 'else',
  'interface', 'type', 'enum', 'extends', 'implements', 'super', 'static',
  'public', 'private', 'protected', 'readonly', 'get', 'set', 'continue',
  'break', 'case', 'default', 'do', 'in', 'of', 'yield', 'void', 'def',
  'return', 'finally', 'null', 'undefined', 'true', 'false', 'from', 'as',
  'package', 'namespace', 'using', 'require', 'module', 'struct', 'trait',
  'impl', 'fn', 'fun', 'function', 'val', 'var', 'is', 'with', 'when',
]);

export function extOf(path: string): string {
  const name = path.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function basenameOf(path: string): string {
  return path.split('/').pop() ?? '';
}

export function dirOf(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/');
}

export function moduleNameOf(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  let base = parts[parts.length - 1].replace(/\.[^.]+$/, '');
  if (base === 'index' && parts.length > 1) base = parts[parts.length - 2];
  return base;
}

export function stripComments(text: string, lang: string): string {
  if (lang === 'py' || lang === 'rb' || lang === 'sh') {
    return text.replace(/#[^\n]*/g, '');
  }
  if (lang === 'go' || lang === 'rs' || lang === 'rust') {
    return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  }
  if (lang === 'lua') {
    return text.replace(/--\[\[[\s\S]*?\]\]/g, ' ').replace(/--[^\n]*/g, ' ');
  }
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

export function findMatchingBrace(text: string, openIndex: number): number {
  let depth = 0;
  let inStr: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function cleanTypeName(raw?: string): string | undefined {
  if (!raw) return undefined;
  let t = raw.trim().replace(/\s+/g, ' ');
  t = t.replace(/^[\w$.]+\./, '');
  t = t.replace(/\?$/, '');
  if (t.includes('<')) {
    t = `${t.slice(0, t.indexOf('<'))}<…>`;
  }
  if (t.length > 24) t = `${t.slice(0, 24)}…`;
  return t || undefined;
}

export function splitParams(params: string): string[] {
  if (!params || !params.trim()) return [];
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of params.trim()) {
    if (ch === '(' || ch === '<' || ch === '[') depth++;
    else if (ch === ')' || ch === '>' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out
    .map((p) => {
      const m = /([A-Za-z_$][\w$]*)\s*(?:[:=]\s*([^=;]+))?$/.exec(p.trim());
      if (!m) return p.trim().split(/\s+/).pop() ?? p.trim();
      return m[2] ? `${m[1]}: ${m[2].trim().replace(/\s+/g, ' ')}` : m[1];
    })
    .filter((p) => p && p !== '_')
    .slice(0, 5);
}

export function visOf(prefix: string): string {
  if (/private/.test(prefix)) return '-';
  if (/protected/.test(prefix)) return '#';
  if (/public/.test(prefix)) return '+';
  return '';
}

export interface BraceMember {
  methods: MethodInfo[];
  properties: PropertyInfo[];
}

export function parseBraceClassBody(body: string): BraceMember {
  const methods: MethodInfo[] = [];
  const properties: PropertyInfo[] = [];
  const seenMethods = new Set<string>();
  const seenProps = new Set<string>();
  const lines = body.split('\n');
  let braceDepth = 0;
  let pendingName: string | null = null;
  let pendingParams = '';
  let pendingParens = 0;
  let pendingPrefix = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

    const open = (line.match(/{/g) ?? []).length;
    const close = (line.match(/}/g) ?? []).length;

    if (pendingName) {
      pendingParens += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
      const lastParen = line.lastIndexOf(')');
      if (pendingParens <= 0 && lastParen >= 0) {
        pendingParams += line.slice(0, lastParen);
        addMethod(pendingName, pendingPrefix, pendingParams);
        pendingName = null;
      } else if (pendingParens <= 0) {
        addMethod(pendingName, pendingPrefix, pendingParams);
        pendingName = null;
      } else {
        pendingParams += ` ${line}`;
      }
      braceDepth += open - close;
      continue;
    }

    if (braceDepth > 0) {
      braceDepth += open - close;
      continue;
    }

    const methodRe =
      /^((?:public|protected|private|static|abstract|async|override|readonly|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?::\s*[^;{=]+)?\s*[`{:>]/.exec(line);
    if (methodRe) {
      const name = methodRe[2];
      const prefix = methodRe[1] ?? '';
      if (RESERVED.has(name) || seenMethods.has(name)) {
        braceDepth += open - close;
        continue;
      }
      if ((line.match(/\(/g) ?? []).length > (line.match(/\)/g) ?? []).length) {
        pendingName = name;
        pendingPrefix = prefix;
        pendingParams = methodRe[3] ?? '';
        pendingParens = (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
        braceDepth += open - close;
        continue;
      }
      addMethod(name, prefix, methodRe[3]);
      braceDepth += open - close;
      continue;
    }

    const arrowRe = /^((?:public|protected|private|static|readonly)\s+)*([A-Za-z_$][\w$]*)\s*[=:]\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/.exec(line);
    if (arrowRe && !RESERVED.has(arrowRe[2]) && !seenMethods.has(arrowRe[2])) {
      addMethod(arrowRe[2], arrowRe[1] ?? '', arrowRe[0]);
      braceDepth += open - close;
      continue;
    }

    const propRe =
      /^((?:public|protected|private|static|readonly|abstract)\s+)*([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$.<>\[\],\s]*?))?\s*(?:=|;|\n|$)/.exec(line);
    if (propRe) {
      const name = propRe[2];
      if (!RESERVED.has(name) && !seenProps.has(name)) {
        seenProps.add(name);
        const type = cleanTypeName(propRe[3]);
        const prefix = propRe[1] ?? '';
        if (prefix || name !== line.replace(/[^A-Za-z_$0-9]/g, '')) {
          properties.push({ name, type, visibility: visOf(prefix) });
        }
      }
    }

    braceDepth += open - close;
  }

  function addMethod(name: string, prefix: string, rawParams?: string) {
    if (seenMethods.has(name)) return;
    seenMethods.add(name);
    methods.push({
      name,
      params: splitParams(rawParams ?? ''),
      visibility: visOf(prefix),
      kind:
        name === 'constructor'
          ? 'constructor'
          : /\bget\b/.test(prefix)
            ? 'getter'
            : /\bset\b/.test(prefix)
              ? 'setter'
              : 'method',
    });
  }

  return { methods: methods.slice(0, 16), properties: properties.slice(0, 14) };
}

export function dedupe(list: string[]): string[] {
  return [...new Set(list)];
}

export function addUnique(list: string[], value: string): void {
  if (value && !list.includes(value)) list.push(value);
}
