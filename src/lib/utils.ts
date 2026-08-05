export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

export function extOf(path: string): string {
  const name = path.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

interface LangMeta {
  label: string;
  color: string;
}

export const LANG_META: Record<string, LangMeta> = {
  js: { label: 'JavaScript', color: '#f7df1e' },
  jsx: { label: 'JavaScript', color: '#f7df1e' },
  mjs: { label: 'JavaScript', color: '#f7df1e' },
  cjs: { label: 'JavaScript', color: '#f7df1e' },
  ts: { label: 'TypeScript', color: '#3178c6' },
  tsx: { label: 'TypeScript', color: '#3178c6' },
  mts: { label: 'TypeScript', color: '#3178c6' },
  cts: { label: 'TypeScript', color: '#3178c6' },
  py: { label: 'Python', color: '#3776ab' },
  go: { label: 'Go', color: '#00add8' },
  rs: { label: 'Rust', color: '#dea584' },
  java: { label: 'Java', color: '#b07219' },
  kt: { label: 'Kotlin', color: '#a97bff' },
  c: { label: 'C', color: '#555555' },
  h: { label: 'C', color: '#555555' },
  cpp: { label: 'C++', color: '#f34b7d' },
  cc: { label: 'C++', color: '#f34b7d' },
  hpp: { label: 'C++', color: '#f34b7d' },
  cs: { label: 'C#', color: '#178600' },
  rb: { label: 'Ruby', color: '#701516' },
  php: { label: 'PHP', color: '#4f5d95' },
  swift: { label: 'Swift', color: '#f05138' },
  dart: { label: 'Dart', color: '#00b4ab' },
  sh: { label: 'Shell', color: '#89e051' },
  bash: { label: 'Shell', color: '#89e051' },
  zsh: { label: 'Shell', color: '#89e051' },
  html: { label: 'HTML', color: '#e34c26' },
  htm: { label: 'HTML', color: '#e34c26' },
  css: { label: 'CSS', color: '#563d7c' },
  scss: { label: 'SCSS', color: '#c6538c' },
  less: { label: 'Less', color: '#1d365d' },
  json: { label: 'JSON', color: '#8a63d2' },
  yaml: { label: 'YAML', color: '#cb171e' },
  yml: { label: 'YAML', color: '#cb171e' },
  toml: { label: 'TOML', color: '#9c4221' },
  xml: { label: 'XML', color: '#0060ac' },
  md: { label: 'Markdown', color: '#0969da' },
  mdx: { label: 'Markdown', color: '#0969da' },
  sql: { label: 'SQL', color: '#e38c00' },
  dockerfile: { label: 'Docker', color: '#2496ed' },
  lock: { label: 'Lockfile', color: '#818b98' },
  vue: { label: 'Vue', color: '#41b883' },
  svelte: { label: 'Svelte', color: '#ff3e00' },
  r: { label: 'R', color: '#198ce7' },
  lua: { label: 'Lua', color: '#000080' },
  pl: { label: 'Perl', color: '#0298c3' },
  scala: { label: 'Scala', color: '#c22d40' },
  ex: { label: 'Elixir', color: '#6e4a7e' },
  hs: { label: 'Haskell', color: '#5e5086' },
  clj: { label: 'Clojure', color: '#db5855' },
  sol: { label: 'Solidity', color: '#aa6746' },
  tf: { label: 'Terraform', color: '#844fba' },
  gradle: { label: 'Gradle', color: '#02303a' },
  prisma: { label: 'Prisma', color: '#0c344b' },
  graphql: { label: 'GraphQL', color: '#e10098' },
  proto: { label: 'Protobuf', color: '#6f42c1' },
  ini: { label: 'INI', color: '#818b98' },
  conf: { label: 'Config', color: '#818b98' },
  env: { label: 'Env', color: '#818b98' },
  txt: { label: 'Text', color: '#818b98' },
  log: { label: 'Log', color: '#818b98' },
  csv: { label: 'CSV', color: '#1a7f37' },
  svg: { label: 'SVG', color: '#ffb13b' },
  png: { label: 'Image', color: '#818b98' },
  jpg: { label: 'Image', color: '#818b98' },
  jpeg: { label: 'Image', color: '#818b98' },
  gif: { label: 'Image', color: '#818b98' },
  webp: { label: 'Image', color: '#818b98' },
  ico: { label: 'Image', color: '#818b98' },
  woff: { label: 'Font', color: '#818b98' },
  woff2: { label: 'Font', color: '#818b98' },
  ttf: { label: 'Font', color: '#818b98' },
  otf: { label: 'Font', color: '#818b98' },
};

const SPECIAL_FILES: Record<string, LangMeta> = {
  'package.json': { label: 'JSON', color: '#8a63d2' },
  dockerfile: { label: 'Docker', color: '#2496ed' },
  'makefile': { label: 'Makefile', color: '#a074c4' },
  'readme.md': { label: 'Markdown', color: '#0969da' },
};

export function langMetaOf(path: string): LangMeta {
  const base = path.split('/').pop() ?? '';
  const lower = base.toLowerCase();
  if (SPECIAL_FILES[lower]) return SPECIAL_FILES[lower];
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) return SPECIAL_FILES.dockerfile;
  if (lower === 'makefile') return SPECIAL_FILES.makefile;
  const ext = extOf(path);
  if (LANG_META[ext]) return LANG_META[ext];
  if (ext === 'json') return LANG_META.json;
  return { label: 'File', color: '#818b98' };
}

const TEXT_EXTS = new Set(
  Object.keys(LANG_META).filter((k) =>
    !['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'otf', 'svg'].includes(k),
  ),
);

const BINARY_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'otf']);

export function isLikelyText(name: string): boolean {
  const base = name.toLowerCase();
  if (base === 'license' || base === 'changelog' || base === 'authors' || base === 'contributors') return true;
  const ext = extOf(name);
  if (BINARY_EXTS.has(ext)) return false;
  if (TEXT_EXTS.has(ext)) return true;
  if (!ext) return true;
  return false;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export function downloadText(content: string, filename: string, mime = 'text/markdown'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countLines(content: string): number {
  if (!content) return 0;
  return content.split('\n').filter((l) => l.trim().length > 0).length;
}
