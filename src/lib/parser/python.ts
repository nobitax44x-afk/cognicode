import type { ParseResult, ParsedSymbol } from './helpers';
import { addUnique, dedupe, stripComments, type MethodInfo, type PropertyInfo } from './helpers';

interface ClassScope {
  symbol: ParsedSymbol;
  indent: number;
  active: boolean;
}

export function parsePython(path: string, content: string): ParseResult {
  const text = stripComments(content, 'py');
  const result: ParseResult = { imports: [], exports: [], symbols: [] };
  const lines = text.split('\n');

  for (const line of lines) {
    const t = line.trim();
    const fromRe = /^from\s+([\w.]+)\s+import\s+(.+)$/.exec(t);
    if (fromRe) {
      addUnique(result.imports, fromRe[1]);
      for (const name of fromRe[2].split(',')) {
        const n = /^\w+/.exec(name.trim())?.[0];
        if (n && n !== '*') addUnique(result.exports, n);
      }
      continue;
    }
    const impRe = /^import\s+([\w., ]+)$/.exec(t);
    if (impRe) {
      for (const part of impRe[1].split(',')) {
        const n = /^\w+/.exec(part.trim())?.[0];
        if (n) addUnique(result.imports, n);
      }
    }
  }

  const stack: ClassScope[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const t = line.trim();

    const classRe = /^class\s+(\w+)\s*(?:\(([^)]*)\))?:/.exec(t);
    if (classRe) {
      while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
      const bases = (classRe[2] ?? '')
        .split(',')
        .map((b) => b.trim().replace(/<.*/, ''))
        .filter((b) => /^\w+$/.test(b));
      const symbol: ParsedSymbol = {
        name: classRe[1],
        kind: 'class',
        superclass: bases[0],
        implements: bases.slice(1),
        methods: [],
        properties: [],
        line: i + 1,
      };
      stack.push({ symbol, indent, active: true });
      result.symbols.push(symbol);
      continue;
    }

    if (stack.length === 0) continue;
    const top = stack[stack.length - 1];
    if (indent <= top.indent) {
      while (stack.length && indent <= stack[stack.length - 1].indent) {
        stack[stack.length - 1].active = false;
        stack.pop();
      }
      if (stack.length) stack[stack.length - 1].active = true;
      continue;
    }

    if (!top.active) continue;

    const defRe = /^def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/.exec(t);
    if (defRe) {
      const name = defRe[1];
      if (name === '__init__' || name.startsWith('__')) continue;
      if (top.symbol.methods.length >= 16) continue;
      const method: MethodInfo = {
        name,
        params: splitPyParams(defRe[2]),
        visibility: name.startsWith('_') ? '-' : '+',
        kind: 'method',
      };
      top.symbol.methods.push(method);
      continue;
    }

    const propRe = /^self\.(\w+)\s*[:=]/.exec(t);
    if (propRe) {
      const name = propRe[1];
      if (top.symbol.properties.length < 14 && !top.symbol.properties.some((p) => p.name === name)) {
        top.symbol.properties.push({
          name,
          visibility: name.startsWith('_') ? '-' : '+',
        });
      }
      continue;
    }

    const classAttrRe = /^(\w+)\s*:\s*([\w\[\],. ]+)\s*=/.exec(t);
    if (classAttrRe) {
      if (top.symbol.properties.length < 14 && !top.symbol.properties.some((p) => p.name === classAttrRe[1])) {
        top.symbol.properties.push({
          name: classAttrRe[1],
          type: classAttrRe[2].trim().replace(/\s+/g, ''),
          visibility: classAttrRe[1].startsWith('_') ? '-' : '+',
        });
      }
    }
  }

  result.imports = dedupe(result.imports);
  return result;
}

function splitPyParams(params: string): string[] {
  if (!params.trim()) return [];
  return params
    .split(',')
    .map((p) => p.trim().replace(/[:=].*$/, ''))
    .filter((p) => p && p !== 'self' && p !== 'cls')
    .slice(0, 5);
}
