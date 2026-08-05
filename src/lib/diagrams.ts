import type { ClassInfo, DiagramDef, ModuleNode, ProjectAnalysis, UploadedFile } from '../types';
import { quote, safeId } from './mermaidRepair';

const NON_TEST = /(?:\.test\.|\.spec\.|test_|_test\.|__tests__|\/fixtures\/|\/mocks\/|\/__mocks__\/)/i;

interface EdgeIndex {
  fileByKey: Map<string, string>;
  dirIndex: Map<string, string[]>;
}

interface ResolveCtx extends EdgeIndex {
  commonRoot: string;
  goModule: string | null;
}

interface GraphResult {
  edges: Array<[string, string]>;
  cycleKeys: Set<string>;
  cycles: string[][];
}

function shortName(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  let base = parts[parts.length - 1].replace(/\.[^.]+$/, '');
  if (base === 'index' && parts.length > 1) base = parts[parts.length - 2];
  return base;
}

function isTestFile(path: string): boolean {
  return NON_TEST.test(path);
}

function buildEdgeIndex(files: UploadedFile[]): EdgeIndex {
  const fileByKey = new Map<string, string>();
  const dirIndex = new Map<string, string[]>();
  for (const f of files) {
    if (f.isBinary || !f.content) continue;
    const noExt = f.path.replace(/\.[^.]+$/, '');
    fileByKey.set(noExt, f.path);
    const dir = f.path.split('/').slice(0, -1).join('/');
    const arr = dirIndex.get(dir) ?? [];
    arr.push(f.path);
    dirIndex.set(dir, arr);
    const base = noExt.split('/').pop() ?? '';
    if (base === 'index' || base === '__init__' || base === 'main' || base === 'mod') {
      fileByKey.set(dir, f.path);
    }
  }
  return { fileByKey, dirIndex };
}

function commonRootOf(modules: ModuleNode[]): string {
  const dirs = modules.map((m) => m.dir.split('/')).filter((d) => d.length > 0);
  if (dirs.length === 0) return '';
  let prefix = dirs[0];
  for (const d of dirs.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < d.length && prefix[i] === d[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix.join('/');
}

function goModuleOf(files: UploadedFile[]): string | null {
  const f = files.find((x) => x.path.split('/').pop()?.toLowerCase() === 'go.mod');
  const m = f?.content ? /^module\s+([^\s]+)/m.exec(f.content) : null;
  return m?.[1] ?? null;
}

function normalizeRelative(dir: string, spec: string): string {
  const stack = dir.split('/').filter(Boolean);
  for (const p of spec.split('/')) {
    if (p === '.' || p === '') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return stack.join('/');
}

function candidatesFor(ctx: ResolveCtx, mod: ModuleNode, spec: string): string[] {
  const out: string[] = [];
  const add = (k: string) => {
    if (k && !out.includes(k)) out.push(k);
  };
  const lang = mod.lang;
  const dir = mod.dir;
  const root = ctx.commonRoot;
  const clean = (s: string) => s.replace(/\.[^.]+$/, '');

  if (spec.startsWith('@/') || spec.startsWith('~/')) {
    const rel = clean(spec.slice(2));
    add(root ? `${root}/${rel}` : rel);
    return out;
  }

  if (spec.startsWith('./') || spec.startsWith('../') || spec === '.' || spec === '..') {
    add(normalizeRelative(dir, clean(spec)));
    return out;
  }

  switch (lang) {
    case 'Python': {
      let p = clean(spec);
      if (p.startsWith('.')) {
        let dots = 0;
        while (p.startsWith('.')) dots++;
        const rest = p.slice(dots).replace(/\./g, '/');
        const base = dir.split('/').slice(0, 1 - dots).join('/');
        add(base ? `${base}/${rest}` : rest);
        add(base ? `${base}/${rest}/__init__` : `${rest}/__init__`);
        return out;
      }
      const path = p.replace(/\./g, '/');
      add(path);
      add(`${path}/__init__`);
      if (root) {
        add(`${root}/${path}`);
        add(`${root}/${path}/__init__`);
      }
      return out;
    }
    case 'Go': {
      const path = clean(spec);
      if (ctx.goModule && path.startsWith(ctx.goModule)) {
        const rel = path.slice(ctx.goModule.length).replace(/^\/+/, '');
        add(rel);
        if (root) add(`${root}/${rel}`);
      } else if (path.startsWith('.')) {
        add(normalizeRelative(dir, clean(path)));
      }
      return out;
    }
    case 'Rust': {
      if (spec.startsWith('mod::')) {
        const rel = spec.slice(5);
        add(`${dir}/${rel}`);
        add(`${dir}/${rel}/mod`);
        return out;
      }
      if (spec.startsWith('crate::')) {
        const parts = spec.slice(7).split('::');
        const last = parts[parts.length - 1];
        const path = parts.slice(0, -1).join('/');
        if (path) add(`${root}/${path}`);
        if (/^[A-Z]/.test(last)) add(`${root}/${parts.join('/')}`);
        return out;
      }
      if (spec.startsWith('super::')) {
        const rel = spec.slice(7).split('::').join('/');
        const parent = dir.split('/').slice(0, -1).join('/');
        add(parent ? `${parent}/${rel}` : rel);
        return out;
      }
      if (spec.startsWith('self::')) {
        const rel = spec.slice(6).split('::').join('/');
        add(`${dir}/${rel}`);
        return out;
      }
      const parts = spec.split('::');
      if (parts.length >= 2) {
        const path = parts.slice(0, -1).join('/');
        if (path) add(`${root}/${path}`);
      }
      return out;
    }
    case 'Java':
    case 'Kotlin': {
      const path = clean(spec).replace(/\./g, '/').replace(/\/\*$/, '');
      if (root) add(`${root}/${path}`);
      add(path);
      add(`src/main/java/${path}`);
      add(`src/main/kotlin/${path}`);
      return out;
    }
    case 'C#': {
      const path = clean(spec).replace(/\./g, '/');
      if (root) add(`${root}/${path}`);
      add(path);
      add(`src/${path}`);
      return out;
    }
    case 'PHP': {
      const path = clean(spec.replace(/\\/g, '/'));
      add(path);
      add(`src/${path}`);
      if (root) add(`${root}/${path}`);
      return out;
    }
    case 'Ruby': {
      const path = clean(spec);
      add(path);
      add(`lib/${path}`);
      add(`app/${path}`);
      return out;
    }
    case 'Dart': {
      const path = clean(spec.replace(/^package:/, ''));
      add(path);
      if (root) add(`${root}/${path}`);
      return out;
    }
    default:
      return out;
  }
}

function lookup(ctx: ResolveCtx, key: string): string | null {
  if (ctx.fileByKey.has(key)) return ctx.fileByKey.get(key)!;
  const files = ctx.dirIndex.get(key);
  if (files && files.length) {
    return files.find((f) => !isTestFile(f)) ?? files[0];
  }
  return null;
}

function resolveGraph(analysis: ProjectAnalysis, files: UploadedFile[]): GraphResult {
  const index = buildEdgeIndex(files);
  const modules = analysis.modules;
  const ctx: ResolveCtx = {
    ...index,
    commonRoot: commonRootOf(modules),
    goModule: goModuleOf(files),
  };
  const edges: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const mod of modules) {
    for (const spec of mod.imports) {
      for (const key of candidatesFor(ctx, mod, spec)) {
        const target = lookup(ctx, key);
        if (!target || target === mod.file) continue;
        const pair = `${mod.file}->${target}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        edges.push([mod.file, target]);
      }
    }
  }
  const { cycleKeys, cycles } = findCycles(edges);
  return { edges, cycleKeys, cycles };
}

function findCycles(edges: Array<[string, string]>): { cycleKeys: Set<string>; cycles: string[][] } {
  const adj = new Map<string, string[]>();
  for (const [a, b] of edges) {
    const arr = adj.get(a) ?? [];
    arr.push(b);
    adj.set(a, arr);
  }
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const compOf = new Map<string, number>();
  let counter = 0;
  let compId = 0;

  for (const root of adj.keys()) {
    if (index.has(root)) continue;
    const work: Array<{ node: string; next: number }> = [{ node: root, next: 0 }];
    index.set(root, counter);
    low.set(root, counter);
    counter++;
    stack.push(root);
    onStack.add(root);
    while (work.length) {
      const cur = work[work.length - 1];
      const neighbors = adj.get(cur.node) ?? [];
      if (cur.next < neighbors.length) {
        const w = neighbors[cur.next++];
        if (!index.has(w)) {
          index.set(w, counter);
          low.set(w, counter);
          counter++;
          stack.push(w);
          onStack.add(w);
          work.push({ node: w, next: 0 });
        } else if (onStack.has(w)) {
          low.set(cur.node, Math.min(low.get(cur.node), index.get(w)));
        }
      } else {
        work.pop();
        if (work.length) {
          const parent = work[work.length - 1].node;
          low.set(parent, Math.min(low.get(parent), low.get(cur.node)));
        }
        if (low.get(cur.node) === index.get(cur.node)) {
          const comp: string[] = [];
          let w: string;
          do {
            w = stack.pop()!;
            onStack.delete(w);
            comp.push(w);
          } while (w !== cur.node);
          if (comp.length > 1) {
            for (const n of comp) compOf.set(n, compId);
            compId++;
          }
        }
      }
    }
  }
  const cycles = new Map<number, string[]>();
  for (const [n, cid] of compOf) {
    const arr = cycles.get(cid) ?? [];
    arr.push(n);
    cycles.set(cid, arr);
  }
  const cycleKeys = new Set<string>();
  for (const [a, b] of edges) {
    if (compOf.has(a) && compOf.get(a) === compOf.get(b)) cycleKeys.add(`${a}->${b}`);
  }
  return { cycleKeys, cycles: [...cycles.values()] };
}

function entryOf(analysis: ProjectAnalysis): string | null {
  return analysis.entryPoints[0] ?? analysis.modules[0]?.file ?? null;
}

function labelOf(f: string, selected: string[]): string {
  const base = shortName(f);
  const count = selected.filter((x) => shortName(x) === base).length;
  if (count > 1) {
    const parts = f.split('/');
    const dir = parts.slice(0, -1).pop();
    return dir ? `${dir}/${base}` : base;
  }
  return base;
}

function architectureDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const modules = analysis.modules;
  if (modules.length === 0) return directoryTreeDiagram(analysis, files);

  const { edges, cycleKeys } = graph;
  const entry = entryOf(analysis);

  const degree = new Map<string, number>();
  for (const [a, b] of edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }

  const allNodes = [...new Set([...modules.map((m) => m.file), ...edges.flat()])];
  const MAX_NODES = 32;
  const ranked = [...allNodes].sort(
    (a, b) =>
      (b === entry ? 1 : 0) - (a === entry ? 1 : 0) ||
      (degree.get(b) ?? 0) - (degree.get(a) ?? 0) ||
      a.localeCompare(b),
  );
  const selected = ranked.slice(0, MAX_NODES);
  const omitted = allNodes.length - selected.length;
  const selectedSet = new Set(selected);

  const lines: string[] = ['flowchart TD'];
  const idOf = new Map<string, string>();
  let counter = 0;
  const nodeId = (f: string): string => {
    const existing = idOf.get(f);
    if (existing) return existing;
    const id = `N${counter++}`;
    idOf.set(f, id);
    return id;
  };

  const tops = new Set(allNodes.map((n) => n.split('/')[0]));
  const clusterOf = (f: string): string => {
    const parts = f.split('/');
    if (tops.size === 1 && parts.length > 2) return `${parts[0]}/${parts[1]}`;
    return parts[0] ?? '';
  };

  const clusters = new Map<string, string[]>();
  for (const f of selected) {
    const c = clusterOf(f);
    const arr = clusters.get(c) ?? [];
    arr.push(f);
    clusters.set(c, arr);
  }

  for (const [cluster, nodes] of [...clusters.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!cluster) {
      for (const f of nodes) {
        lines.push(`  ${nodeId(f)}[${quote(labelOf(f, selected))}]`);
      }
    } else {
      lines.push(`  subgraph ${safeId(cluster)}[${quote(cluster)}]`);
      for (const f of nodes) {
        lines.push(`    ${nodeId(f)}[${quote(labelOf(f, selected))}]`);
      }
      lines.push('  end');
    }
  }

  if (entry && selectedSet.has(entry)) {
    lines.push(`  U${counter++}[${quote('User / Client')}] --> ${nodeId(entry)}`);
  }

  let edgeCount = 0;
  const used = new Set<string>();
  if (edges.length === 0) {
    for (let i = 0; i < selected.length - 1 && edgeCount < 24; i++, edgeCount++) {
      lines.push(`  ${nodeId(selected[i])} --> ${nodeId(selected[i + 1])}`);
    }
    if (selected.length <= 1) {
      const noteId = `N${counter++}`;
      lines.push(`  ${noteId}[${quote('No import relationships found — showing discovered modules')}]`);
      lines.push(`  ${nodeId(selected[0])} -.- ${noteId}`);
    }
  } else {
    for (const [a, b] of edges) {
      if (!selectedSet.has(a) || !selectedSet.has(b)) continue;
      const key = `${idOf.get(a)}->${idOf.get(b)}`;
      if (used.has(key)) continue;
      used.add(key);
      lines.push(`  ${nodeId(a)} --> ${nodeId(b)}`);
      if (++edgeCount >= 40) break;
    }
  }

  if (cycleKeys.size > 0) {
    lines.push('  classDef cyc fill:#7f1d1d,stroke:#dc2626,color:#ffffff,font-weight:bold;');
    const cyclicNodes = new Set<string>();
    for (const key of cycleKeys) cyclicNodes.add(key.split('->')[0]);
    for (const f of cyclicNodes) {
      if (selectedSet.has(f)) lines.push(`  class ${nodeId(f)} cyc;`);
    }
  }

  if (entry && selectedSet.has(entry)) {
    lines.push('  classDef entry fill:#1d4ed8,stroke:#3b82f6,color:#ffffff,font-weight:bold;');
    lines.push(`  class ${nodeId(entry)} entry;`);
  }

  if (omitted > 0) {
    const id = `N${counter++}`;
    lines.push(`  ${id}[${quote(`… and ${omitted} more files`)}]`);
    const hub = [...selected].sort((x, y) => (degree.get(y) ?? 0) - (degree.get(x) ?? 0))[0];
    if (hub) lines.push(`  ${id} -.- ${nodeId(hub)}`);
  }

  return lines.join('\n');
}

function directoryTreeDiagram(analysis: ProjectAnalysis, files: UploadedFile[]): string {
  const textFiles = files.filter((f) => !f.isBinary && f.content);
  const lines: string[] = ['flowchart TD'];
  const idOf = new Map<string, string>();
  const nodeOf = (path: string, label: string): string => {
    let id = idOf.get(path);
    if (!id) {
      id = `D${idOf.size}`;
      idOf.set(path, id);
      lines.push(`  ${id}[${quote(label)}]`);
    }
    return id;
  };
  const root = nodeOf('__root__', analysis.projectName ?? 'Project');
  if (textFiles.length === 0) {
    const note = nodeOf('__empty__', 'No source files detected');
    lines.push(`  ${root} --> ${note}`);
    return lines.join('\n');
  }

  const tree = new Map<string, Set<string>>();
  for (const f of textFiles) {
    const parts = f.path.split('/');
    for (let i = 0; i < parts.length; i++) {
      const parentKey = i === 0 ? '__root__' : parts.slice(0, i).join('/');
      const key = parts.slice(0, i + 1).join('/');
      const arr = tree.get(parentKey) ?? new Set<string>();
      arr.add(key);
      tree.set(parentKey, arr);
    }
  }

  let emitted = 0;
  const MAX_TREE = 44;
  const emit = (parentKey: string) => {
    const children = [...(tree.get(parentKey) ?? [])].sort();
    for (const child of children) {
      if (emitted >= MAX_TREE) return;
      const isDir = tree.has(child);
      const label = `${child.split('/').pop() ?? child}${isDir ? '/' : ''}`;
      const parentId = parentKey === '__root__' ? root : idOf.get(parentKey)!;
      const id = nodeOf(child, label);
      lines.push(`  ${parentId} --> ${id}`);
      emitted++;
      if (isDir) emit(child);
    }
  };
  emit('__root__');

  if (emitted >= MAX_TREE) {
    const last = [...idOf.keys()].filter((k) => k !== '__root__').pop();
    const more = nodeOf('__more__', '… and more files');
    lines.push(`  ${last ? idOf.get(last)! : root} --> ${more}`);
  }
  return lines.join('\n');
}

function scoreClass(c: ClassInfo): number {
  let s = 0;
  if (c.methods.length) s += 2;
  if (c.superclass || c.implements.length) s += 3;
  s += c.properties.length;
  if (c.kind === 'interface' || c.kind === 'trait') s += 1;
  return s;
}

function emitClass(lines: string[], c: ClassInfo, idOf: Map<string, string>): void {
  const id = idOf.get(c.name)!;
  lines.push(`  class ${id} {`);
  const defaultVis = c.kind === 'class' || c.kind === 'struct' ? '-' : '+';
  for (const p of c.properties.slice(0, 10)) {
    const vis = p.visibility || defaultVis;
    lines.push(`    ${vis}${p.name}${p.type ? `: ${p.type}` : ''}`);
  }
  const ctor = c.methodInfo.find((m) => m.kind === 'constructor');
  if (ctor) lines.push(`    ${ctor.visibility || '+'}${ctor.name}(${ctor.params.join(', ')})`);
  const rest = c.methodInfo.filter((m) => m.kind !== 'constructor').slice(0, 10);
  for (const m of rest) {
    lines.push(`    ${m.visibility || '+'}${m.name}(${m.params.join(', ')})`);
  }
  if (c.methods.length === 0 && c.properties.length === 0) lines.push('    …');
  lines.push('  }');
}

function classDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const classes = analysis.classes;
  if (classes.length === 0) return moduleFallbackDiagram(analysis, files, graph);

  const byName = new Map<string, ClassInfo>();
  const usedIds = new Set<string>();
  const idOf = new Map<string, string>();
  const uniq = (name: string): string => {
    let base = safeId(name);
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}_${n++}`;
    usedIds.add(id);
    return id;
  };
  for (const c of classes) {
    if (byName.has(c.name)) continue;
    byName.set(c.name, c);
    idOf.set(c.name, uniq(c.name));
  }

  const ranked = [...byName.values()].sort((a, b) => scoreClass(b) - scoreClass(a));
  const showSet = new Set<string>();
  for (const c of ranked) {
    if (showSet.size >= 16) break;
    showSet.add(c.name);
  }
  for (const c of ranked) {
    if (!showSet.has(c.name)) continue;
    if (c.superclass && byName.has(c.superclass)) showSet.add(c.superclass);
    for (const i of c.implements) if (byName.has(i)) showSet.add(i);
  }

  const lines: string[] = ['classDiagram'];
  const shown = [...showSet].map((n) => byName.get(n)!);
  for (const c of shown) emitClass(lines, c, idOf);

  const seen = new Set<string>();
  const addRel = (line: string): void => {
    const key = line.replace(/\s+/g, ' ');
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(`  ${line}`);
  };

  for (const c of shown) {
    if (c.superclass && idOf.has(c.superclass)) {
      addRel(`${idOf.get(c.superclass)!} <|-- ${idOf.get(c.name)!}`);
    }
    for (const impl of c.implements) {
      if (idOf.has(impl)) addRel(`${idOf.get(impl)!} <|.. ${idOf.get(c.name)!}`);
    }
  }

  for (const c of shown) {
    for (const p of c.properties) {
      if (p.type && idOf.has(p.type)) {
        addRel(`${idOf.get(c.name)!} *-- ${idOf.get(p.type)!}`);
      }
    }
  }

  const fileClasses = new Map<string, string[]>();
  for (const c of shown) {
    const arr = fileClasses.get(c.file) ?? [];
    arr.push(idOf.get(c.name)!);
    fileClasses.set(c.file, arr);
  }
  for (const [a, b] of graph.edges) {
    const ca = fileClasses.get(a) ?? [];
    const cb = fileClasses.get(b) ?? [];
    for (const x of ca) {
      for (const y of cb) {
        if (x !== y) addRel(`${x} ..> ${y}`);
      }
    }
  }
  return lines.join('\n');
}

function moduleFallbackDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const mods = analysis.modules;
  const lines: string[] = ['flowchart LR'];
  if (mods.length === 0) {
    lines.push(`NOTE[${quote('No classes or modules detected')}]`);
    return lines.join('\n');
  }
  const selected = mods.slice(0, 20);
  const idOf = new Map<string, string>();
  let counter = 0;
  const nodeId = (f: string): string => {
    const existing = idOf.get(f);
    if (existing) return existing;
    const id = `M${counter++}`;
    idOf.set(f, id);
    return id;
  };
  for (const m of selected) lines.push(`  ${nodeId(m.file)}[${quote(shortName(m.file))}]`);
  lines.push(`  NOTE[${quote('No classes detected — showing module graph')}]`);
  if (selected[0]) lines.push(`  ${nodeId(selected[0].file)} -.- NOTE`);

  const selectedSet = new Set(selected.map((m) => m.file));
  const seen = new Set<string>();
  let count = 0;
  for (const [a, b] of graph.edges) {
    if (!selectedSet.has(a) || !selectedSet.has(b)) continue;
    const key = `${idOf.get(a)}->${idOf.get(b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`  ${nodeId(a)} --> ${nodeId(b)}`);
    if (++count >= 30) break;
  }
  return lines.join('\n');
}

function sequenceDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const entry = entryOf(analysis);
  const entryName = entry ? shortName(entry) : 'Application';
  const edges = graph.edges;

  const fromEntry = edges.filter(([a]) => a === entry).map(([, b]) => b);
  const handlerFile = fromEntry[0] ?? analysis.modules.find((m) => m.file !== entry)?.file;
  const handler = handlerFile ? shortName(handlerFile) : 'Handler';
  const nextEdge = fromEntry[0] ? edges.find(([a]) => a === fromEntry[0]) : undefined;
  const dataModule = nextEdge ? shortName(nextEdge[1]) : 'Data';

  const participants = [...new Set(['Client', entryName, handler, dataModule])];
  const lines: string[] = ['sequenceDiagram'];
  for (const p of participants) lines.push(`  participant ${quote(p)}`);

  const endpoint = analysis.endpoints[0];
  const requestLabel = endpoint ? `${endpoint.method} ${endpoint.path}` : 'request';

  lines.push(`  ${quote('Client')}->>${quote(entryName)}: ${requestLabel}`);
  lines.push(`  ${quote(entryName)}->>${quote(handler)}: dispatch`);
  lines.push(`  ${quote(handler)}->>${quote(dataModule)}: query`);
  lines.push(`  ${quote(dataModule)}-->>${quote(handler)}: result`);
  lines.push(`  ${quote(handler)}-->>${quote(entryName)}: payload`);
  lines.push(`  ${quote(entryName)}-->>${quote('Client')}: response`);
  return lines.join('\n');
}

function flowDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const entry = entryOf(analysis);
  const entryName = entry ? shortName(entry) : 'Entry Point';
  const edges = graph.edges;

  const fromEntry = edges.filter(([a]) => a === entry).map(([, b]) => b);
  const steps = [entryName];
  if (fromEntry[0]) {
    const second = shortName(fromEntry[0]);
    if (second !== entryName) steps.push(second);
  }
  const thirdFile = fromEntry[1] ?? (fromEntry[0] ? edges.find(([a]) => a === fromEntry[0])?.[1] : undefined);
  if (thirdFile) {
    const third = shortName(thirdFile);
    if (third !== steps[steps.length - 1]) steps.push(third);
  }
  if (steps.length === 1) {
    const alt = analysis.modules.find((m) => m.file !== entry);
    if (alt) steps.push(shortName(alt.file));
  }

  const endpoint = analysis.endpoints[0];
  const nodes: string[] = ['flowchart LR'];
  nodes.push(`  IN[${quote('Input')}] --> EP[${quote(steps[0])}]`);
  let prev = 'EP';
  for (let i = 1; i < steps.length; i++) {
    const id = `S${i - 1}`;
    nodes.push(`  ${prev} --> ${id}[${quote(steps[i])}]`);
    prev = id;
  }
  if (endpoint) nodes.push(`  ${prev} -->|${endpoint.method} ${endpoint.path}| DB[${quote('Data / Storage')}]`);
  else nodes.push(`  ${prev} --> DB[${quote('Data / Storage')}]`);
  nodes.push(`  DB --> OUT[${quote('Output / Response')}]`);
  return nodes.join('\n');
}

function erDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  let entities = analysis.classes.filter((c) => /model|entity|schema|table|dto|repo|db/i.test(c.file));
  if (entities.length === 0) entities = analysis.classes.filter((c) => c.kind !== 'interface' && c.kind !== 'trait');
  if (entities.length === 0) {
    const mods = analysis.modules.slice(0, 4);
    if (mods.length === 0) {
      return ['erDiagram', '  ENTITY {', '    string id PK', '    string name', '  }'].join('\n');
    }
    entities = mods.map((m) => ({
      name: shortName(m.file),
      file: m.file,
      kind: 'class' as const,
      methods: [],
      methodInfo: [],
      properties: [],
      implements: [],
    }));
  }
  entities = entities.slice(0, 6);

  const lines: string[] = ['erDiagram'];
  const fileToEntities = new Map<string, string[]>();
  const usedIds = new Set<string>();
  for (const ent of entities) {
    let id = ent.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    let n = 1;
    while (usedIds.has(id)) {
      id = `${ent.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_${n++}`;
    }
    usedIds.add(id);
    const arr = fileToEntities.get(ent.file) ?? [];
    arr.push(id);
    fileToEntities.set(ent.file, arr);

    lines.push(`  ${id} {`);
    lines.push('    string id PK');
    const props = ent.properties.map((p) => p.name).slice(0, 6);
    for (const p of props) if (p !== 'id') lines.push(`    string ${p}`);
    if (props.length === 0) lines.push('    string name');
    lines.push('  }');
  }

  const seen = new Set<string>();
  let relCount = 0;
  for (const [from, to] of graph.edges) {
    for (const a of fileToEntities.get(from) ?? []) {
      for (const b of fileToEntities.get(to) ?? []) {
        if (a === b) continue;
        const key = `${a}|${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push(`  ${a} ||--o{ ${b} : has`);
        if (++relCount >= 8) break;
      }
    }
  }
  return lines.join('\n');
}

function stateDiagram(analysis: ProjectAnalysis, files: UploadedFile[], graph: GraphResult): string {
  const entry = entryOf(analysis);
  const edges = graph.edges;

  const chain: string[] = [];
  let cur = entry;
  const visited = new Set<string>();
  while (cur && chain.length < 4) {
    visited.add(cur);
    chain.push(shortName(cur));
    const next = edges.find(([a, b]) => a === cur && !visited.has(b))?.[1];
    if (!next) break;
    cur = next;
  }
  if (chain.length === 0) chain.push(analysis.projectName ?? 'Service');

  const names = chain.map(safeId);
  const lines: string[] = ['stateDiagram-v2'];
  lines.push('  [*] --> Idle');
  lines.push(`  Idle --> ${names[0]} : start`);

  let prev = names[0];
  for (let i = 1; i < names.length; i++) {
    lines.push(`  ${prev} --> ${names[i]} : next`);
    prev = names[i];
  }
  lines.push(`  ${prev} --> Processing : request`);
  lines.push('  Processing --> Done : complete');
  lines.push('  Done --> [*]');
  return lines.join('\n');
}

const KINDS = [
  {
    kind: 'architecture',
    title: 'Architecture',
    description: 'Every file as a node, every import as an edge, with directory grouping.',
  },
  {
    kind: 'class',
    title: 'Class Diagram',
    description: 'Classes, interfaces, enums with methods, properties and inheritance.',
  },
  {
    kind: 'sequence',
    title: 'Sequence Diagram',
    description: 'Real request flow through the detected entry and handlers.',
  },
  {
    kind: 'flow',
    title: 'Data Flow',
    description: 'Path from input through the real modules to output.',
  },
  {
    kind: 'er',
    title: 'Entity Relationship',
    description: 'Entities detected from models/classes and their import links.',
  },
  {
    kind: 'state',
    title: 'State Diagram',
    description: 'Lifecycle built from the entry module chain.',
  },
] as const;

export function generateDiagrams(analysis: ProjectAnalysis, files: UploadedFile[]): DiagramDef[] {
  const graph = resolveGraph(analysis, files);
  const defaultSelected = new Set(KINDS.map((k) => k.kind));

  analysis.diagnostics.edges = graph.edges.length;
  const diags = KINDS.map((meta) => {
    const source = (() => {
      switch (meta.kind) {
        case 'architecture':
          return architectureDiagram(analysis, files, graph);
        case 'class':
          return classDiagram(analysis, files, graph);
        case 'sequence':
          return sequenceDiagram(analysis, files, graph);
        case 'flow':
          return flowDiagram(analysis, files, graph);
        case 'er':
          return erDiagram(analysis, files, graph);
        case 'state':
          return stateDiagram(analysis, files, graph);
      }
    })();
    analysis.diagnostics.mermaidLengths[meta.kind] = source.length;
    return {
      id: meta.kind,
      kind: meta.kind,
      title: meta.title,
      description: meta.description,
      source,
      selected: defaultSelected.has(meta.kind),
    };
  });

  console.debug('[cognicode:diagrams]', {
    modules: analysis.modules.length,
    classes: analysis.classes.length,
    edges: graph.edges.length,
    cycles: graph.cycles.length,
    mermaidLengths: analysis.diagnostics.mermaidLengths,
  });
  return diags;
}
