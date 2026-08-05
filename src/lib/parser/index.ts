import type { ClassInfo, ModuleNode, UploadedFile } from '../../types';
import { parseJs } from './js';
import { parsePython } from './python';
import { parseGo } from './go';
import { parseRust } from './rust';
import { parseJava } from './java';
import { parseCsharp } from './csharp';
import { parsePhp } from './php';
import { parseCpp, parseDart, parseRuby, parseSwift } from './misc';
import { basenameOf, dirOf, extOf, moduleNameOf, type ParseResult, type ParserSpec } from './helpers';

export const CODE_EXTS = new Set([
  'ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'go', 'rs', 'java', 'kt', 'cs', 'rb', 'php',
  'vue', 'svelte', 'c', 'h', 'cpp', 'cc', 'hpp', 'swift',
  'dart', 'sol', 'lua', 'r', 'scala', 'ex', 'hs', 'clj', 'pl',
]);

const PARSERS: Record<string, ParserSpec> = {
  ts: { lang: 'TypeScript', parse: parseJs },
  tsx: { lang: 'TypeScript', parse: parseJs },
  mts: { lang: 'TypeScript', parse: parseJs },
  cts: { lang: 'TypeScript', parse: parseJs },
  js: { lang: 'JavaScript', parse: parseJs },
  jsx: { lang: 'JavaScript', parse: parseJs },
  mjs: { lang: 'JavaScript', parse: parseJs },
  cjs: { lang: 'JavaScript', parse: parseJs },
  vue: { lang: 'Vue', parse: (p, c) => parseJs(p, scriptOf(c)) },
  svelte: { lang: 'Svelte', parse: (p, c) => parseJs(p, scriptOf(c)) },
  py: { lang: 'Python', parse: parsePython },
  go: { lang: 'Go', parse: parseGo },
  rs: { lang: 'Rust', parse: parseRust },
  java: { lang: 'Java', parse: (p, c) => parseJava(p, c, false) },
  kt: { lang: 'Kotlin', parse: (p, c) => parseJava(p, c, true) },
  cs: { lang: 'C#', parse: parseCsharp },
  rb: { lang: 'Ruby', parse: parseRuby },
  php: { lang: 'PHP', parse: parsePhp },
  c: { lang: 'C', parse: parseCpp },
  h: { lang: 'C', parse: parseCpp },
  cpp: { lang: 'C++', parse: parseCpp },
  cc: { lang: 'C++', parse: parseCpp },
  hpp: { lang: 'C++', parse: parseCpp },
  swift: { lang: 'Swift', parse: parseSwift },
  dart: { lang: 'Dart', parse: parseDart },
};

function scriptOf(content: string): string {
  const m = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i.exec(content);
  return m?.[1] ?? content;
}

export interface FileParseOutcome {
  lang: string;
  module: ModuleNode;
  classes: ClassInfo[];
  error?: string;
}

export function parseFile(f: UploadedFile): FileParseOutcome | null {
  if (f.isBinary || !f.content) return null;
  const ext = extOf(f.path);
  const spec = PARSERS[ext];
  if (!spec) return null;

  try {
    const result: ParseResult = spec.parse(f.path, f.content);
    const module: ModuleNode = {
      name: moduleNameOf(f.path),
      file: f.path,
      lang: spec.lang,
      dir: dirOf(f.path),
      imports: result.imports,
      exports: result.exports,
    };
    const classes: ClassInfo[] = result.symbols.map((s) => ({
      name: s.name,
      file: f.path,
      kind: s.kind,
      methods: s.methods.map((mm) => mm.name),
      methodInfo: s.methods,
      properties: s.properties,
      superclass: s.superclass,
      implements: s.implements,
      line: s.line,
    }));
    return { lang: spec.lang, module, classes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const module: ModuleNode = {
      name: moduleNameOf(f.path),
      file: f.path,
      lang: spec.lang,
      dir: dirOf(f.path),
      imports: [],
      exports: [],
    };
    return { lang: spec.lang, module, classes: [], error: msg };
  }
}

export function isCodeFile(path: string): boolean {
  return CODE_EXTS.has(extOf(path));
}
