import type { ProjectAnalysis, TechItem, UploadedFile } from '../types';
import { countLines, extOf } from './utils';
import { isCodeFile, parseFile } from './parser';

const FRAMEWORK_MAP: Record<string, TechItem> = {
  react: { name: 'React', kind: 'framework' },
  'react-dom': { name: 'React', kind: 'framework' },
  'next': { name: 'Next.js', kind: 'framework' },
  'remix': { name: 'Remix', kind: 'framework' },
  'gatsby': { name: 'Gatsby', kind: 'framework' },
  'astro': { name: 'Astro', kind: 'framework' },
  vue: { name: 'Vue.js', kind: 'framework' },
  nuxt: { name: 'Nuxt', kind: 'framework' },
  svelte: { name: 'Svelte', kind: 'framework' },
  '@sveltejs/kit': { name: 'SvelteKit', kind: 'framework' },
  angular: { name: 'Angular', kind: 'framework' },
  express: { name: 'Express', kind: 'framework' },
  fastify: { name: 'Fastify', kind: 'framework' },
  koa: { name: 'Koa', kind: 'framework' },
  nestjs: { name: 'NestJS', kind: 'framework' },
  '@nestjs/core': { name: 'NestJS', kind: 'framework' },
  django: { name: 'Django', kind: 'framework' },
  flask: { name: 'Flask', kind: 'framework' },
  'fastapi': { name: 'FastAPI', kind: 'framework' },
  rails: { name: 'Ruby on Rails', kind: 'framework' },
  laravel: { name: 'Laravel', kind: 'framework' },
  spring: { name: 'Spring', kind: 'framework' },
  'spring-boot': { name: 'Spring Boot', kind: 'framework' },
  gin: { name: 'Gin', kind: 'framework' },
  echo: { name: 'Echo', kind: 'framework' },
  fiber: { name: 'Fiber', kind: 'framework' },
  axum: { name: 'Axum', kind: 'framework' },
  actix: { name: 'Actix', kind: 'framework' },
  'actix-web': { name: 'Actix Web', kind: 'framework' },
  rocket: { name: 'Rocket', kind: 'framework' },
  tonic: { name: 'Tonic', kind: 'framework' },
  'gqlgen': { name: 'gqlgen', kind: 'framework' },
};

const TOOL_MAP: Record<string, TechItem> = {
  tailwindcss: { name: 'Tailwind CSS', kind: 'tool' },
  typescript: { name: 'TypeScript', kind: 'language' },
  vite: { name: 'Vite', kind: 'tool' },
  webpack: { name: 'Webpack', kind: 'tool' },
  rollup: { name: 'Rollup', kind: 'tool' },
  eslint: { name: 'ESLint', kind: 'tool' },
  prettier: { name: 'Prettier', kind: 'tool' },
  jest: { name: 'Jest', kind: 'tool' },
  vitest: { name: 'Vitest', kind: 'tool' },
  mocha: { name: 'Mocha', kind: 'tool' },
  cypress: { name: 'Cypress', kind: 'tool' },
  playwright: { name: 'Playwright', kind: 'tool' },
  'testing-library': { name: 'Testing Library', kind: 'tool' },
  'react-testing-library': { name: 'Testing Library', kind: 'tool' },
  axios: { name: 'Axios', kind: 'tool' },
  graphql: { name: 'GraphQL', kind: 'tool' },
  prisma: { name: 'Prisma', kind: 'tool' },
  drizzle: { name: 'Drizzle', kind: 'tool' },
  sequelize: { name: 'Sequelize', kind: 'tool' },
  'typeorm': { name: 'TypeORM', kind: 'tool' },
  mongoose: { name: 'Mongoose', kind: 'tool' },
  redis: { name: 'Redis', kind: 'tool' },
  'node-sass': { name: 'Sass', kind: 'tool' },
  sass: { name: 'Sass', kind: 'tool' },
  zustand: { name: 'Zustand', kind: 'tool' },
  redux: { name: 'Redux', kind: 'tool' },
  'react-query': { name: 'TanStack Query', kind: 'tool' },
  '@tanstack/react-query': { name: 'TanStack Query', kind: 'tool' },
  'react-router': { name: 'React Router', kind: 'tool' },
  'react-router-dom': { name: 'React Router', kind: 'tool' },
  styled: { name: 'styled-components', kind: 'tool' },
  'styled-components': { name: 'styled-components', kind: 'tool' },
  framer: { name: 'Framer Motion', kind: 'tool' },
  motion: { name: 'Motion', kind: 'tool' },
  mui: { name: 'MUI', kind: 'tool' },
  '@mui/material': { name: 'MUI', kind: 'tool' },
  'chakra-ui': { name: 'Chakra UI', kind: 'tool' },
  'antd': { name: 'Ant Design', kind: 'tool' },
  'ant-design': { name: 'Ant Design', kind: 'tool' },
  'element-plus': { name: 'Element Plus', kind: 'tool' },
  swagger: { name: 'Swagger', kind: 'tool' },
  openai: { name: 'OpenAI', kind: 'tool' },
  'openai-node': { name: 'OpenAI', kind: 'tool' },
  zod: { name: 'Zod', kind: 'tool' },
  yup: { name: 'Yup', kind: 'tool' },
};

const LANG_BY_EXT: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  mts: 'TypeScript',
  cts: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  c: 'C',
  h: 'C',
  cpp: 'C++',
  cc: 'C++',
  cs: 'C#',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  dart: 'Dart',
  sh: 'Shell',
  bash: 'Shell',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  vue: 'Vue',
  svelte: 'Svelte',
  r: 'R',
  lua: 'Lua',
  sol: 'Solidity',
};

function findFile(files: UploadedFile[], name: string): UploadedFile | undefined {
  return files.find((f) => {
    const base = f.path.split('/').pop()?.toLowerCase() ?? '';
    return base === name.toLowerCase();
  });
}

function parsePackageJson(files: UploadedFile[]) {
  const pkg = findFile(files, 'package.json');
  if (!pkg?.content) return null;
  try {
    const data = JSON.parse(pkg.content);
    return {
      name: typeof data.name === 'string' ? data.name : null,
      description: typeof data.description === 'string' ? data.description : null,
      license: typeof data.license === 'string' ? data.license : null,
      dependencies: [
        ...Object.keys(data.dependencies ?? {}),
        ...Object.keys(data.devDependencies ?? {}),
      ],
    };
  } catch {
    return null;
  }
}

function detectPackageManager(files: UploadedFile[]): string | null {
  const present = new Set(files.map((f) => f.path.split('/').pop()?.toLowerCase() ?? ''));
  if (present.has('bun.lockb') || present.has('bun.lock')) return 'bun';
  if (present.has('pnpm-lock.yaml')) return 'pnpm';
  if (present.has('yarn.lock')) return 'yarn';
  if (present.has('package-lock.json') || present.has('npm-shrinkwrap.json')) return 'npm';
  if (present.has('package.json')) return 'npm';
  if (present.has('cargo.toml') || present.has('cargo.lock')) return 'cargo';
  if (present.has('go.mod') || present.has('go.sum')) return 'go';
  if (present.has('pom.xml') || present.has('build.gradle')) return 'maven/gradle';
  if (present.has('requirements.txt') || present.has('pyproject.toml')) return 'pip';
  if (present.has('gemfile')) return 'bundler';
  if (present.has('pubspec.yaml')) return 'pub';
  if (present.has('composer.json')) return 'composer';
  return null;
}

function detectLanguage(files: UploadedFile[]): string | null {
  const counts: Record<string, number> = {};
  for (const f of files) {
    if (f.isBinary || !f.content) continue;
    const lang = LANG_BY_EXT[extOf(f.path)];
    if (lang) counts[lang] = (counts[lang] ?? 0) + f.content.length;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function insertNode(root: TreeNode, parts: string[]): void {
  let cur = root;
  parts.forEach((part, i) => {
    const isFile = i === parts.length - 1;
    if (!cur.children.has(part)) {
      cur.children.set(part, { name: part, children: new Map(), isFile });
    }
    cur = cur.children.get(part)!;
  });
}

function sortEntries(map: Map<string, TreeNode>): TreeNode[] {
  return [...map.values()].sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

function renderTree(
  node: TreeNode,
  prefix: string,
  isLast: boolean,
  depth: number,
  maxDepth: number,
  maxEntries: number,
  out: string[],
): void {
  if (out.length >= maxEntries) return;
  out.push(`${prefix}${isLast ? '└── ' : '├── '}${node.name}${node.isFile ? '' : '/'}`);
  if (depth >= maxDepth) return;
  const entries = sortEntries(node.children);
  entries.forEach((child, i) => {
    renderTree(
      child,
      `${prefix}${isLast ? '    ' : '│   '}`,
      i === entries.length - 1,
      depth + 1,
      maxDepth,
      maxEntries,
      out,
    );
  });
}

export function buildStructure(files: UploadedFile[], maxDepth = 2, maxEntries = 24): string[] {
  const paths = files.map((f) => f.path.split('/'));

  let commonRoot: string | null = null;
  const first = paths[0];
  if (first && first.length > 1) {
    const root = first[0];
    const shared = paths.every((p) => p.length > 1 && p[0] === root);
    commonRoot = shared ? root : null;
  }

  const root: TreeNode = { name: '', children: new Map(), isFile: false };
  for (const parts of paths) {
    insertNode(root, commonRoot ? parts.slice(1) : parts);
  }

  const out: string[] = [];
  const entries = sortEntries(root.children);
  if (commonRoot) {
    out.push(`${commonRoot}/`);
    entries.forEach((child, i) =>
      renderTree(child, '', i === entries.length - 1, 0, maxDepth, maxEntries, out),
    );
  } else {
    entries.forEach((child, i) =>
      renderTree(child, '', i === entries.length - 1, 0, maxDepth, maxEntries, out),
    );
  }
  return out;
}

function extractCodeInfo(files: UploadedFile[]) {
  const modules: import('../types').ModuleNode[] = [];
  const classes: import('../types').ClassInfo[] = [];
  const entryPoints: string[] = [];
  const endpoints: import('../types').ApiEndpoint[] = [];
  const parserErrors: Array<{ file: string; error: string }> = [];
  let filesScanned = 0;
  let filesSkipped = 0;
  let codeFiles = 0;
  let importCount = 0;

  const ENTRY_NAMES = new Set([
    'main.ts', 'main.js', 'main.tsx', 'main.jsx', 'index.ts', 'index.js',
    'index.tsx', 'index.jsx', 'app.py', 'main.py', 'main.go', 'server.ts',
    'server.js', 'server.tsx', 'cli.ts', 'cli.js', 'run.py', 'main.rs',
    'main.java', 'program.cs', 'index.php', 'app.rb', 'main.dart',
  ]);

  for (const f of files) {
    filesScanned++;
    if (f.isBinary || !f.content) {
      filesSkipped++;
      continue;
    }
    const content = f.content;
    const ext = extOf(f.path);
    if (!isCodeFile(f.path)) {
      filesSkipped++;
      continue;
    }

    const base = f.path.split('/').pop()?.toLowerCase() ?? '';
    if (ENTRY_NAMES.has(base) || /^(server|app|main|cli|run)[./-]/.test(base)) {
      if (!entryPoints.includes(f.path)) entryPoints.push(f.path);
    }

    if (/(?:app|router|server|bot)\.(get|post|put|patch|delete|all)\(\s*['"`]/i.test(content)) {
      const routeRe = /(?:app|router|server|bot)\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/gi;
      let m: RegExpExecArray | null;
      while ((m = routeRe.exec(content)) && endpoints.length < 24) {
        endpoints.push({ method: m[1].toUpperCase(), path: m[2] });
      }
    }
    if (ext === 'py') {
      const routeRe = /@(?:app|router)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = routeRe.exec(content)) && endpoints.length < 24) {
        endpoints.push({ method: m[1].toUpperCase(), path: m[2] });
      }
    }
    if (ext === 'go') {
      const routeRe = /\.(GET|POST|PUT|PATCH|DELETE)\(\s*"([^"]+)"/g;
      let m: RegExpExecArray | null;
      while ((m = routeRe.exec(content)) && endpoints.length < 24) {
        endpoints.push({ method: m[1], path: m[2] });
      }
    }
    if (ext === 'java') {
      const routeRe = /@(?:Get|Post|Put|Patch|Delete|RequestMapping)Mapping\(\s*["']([^"']+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = routeRe.exec(content)) && endpoints.length < 24) {
        endpoints.push({ method: m[0].includes('Get') ? 'GET' : m[0].includes('Post') ? 'POST' : m[0].includes('Put') ? 'PUT' : m[0].includes('Delete') ? 'DELETE' : 'ANY', path: m[1] });
      }
    }

    const outcome = parseFile(f);
    if (!outcome) {
      filesSkipped++;
      continue;
    }
    codeFiles++;
    importCount += outcome.module.imports.length;
    modules.push(outcome.module);
    for (const cls of outcome.classes) {
      if (classes.length >= 80) break;
      if (!classes.some((c) => c.name === cls.name && c.file === cls.file)) {
        classes.push(cls);
      }
    }
    if (outcome.error) parserErrors.push({ file: f.path, error: outcome.error });
  }

  console.debug('[cognicode:analyze]', {
    filesScanned,
    filesSkipped,
    codeFiles,
    modules: modules.length,
    classes: classes.filter((c) => c.kind === 'class' || c.kind === 'abstract' || c.kind === 'struct').length,
    interfaces: classes.filter((c) => c.kind === 'interface' || c.kind === 'trait').length,
    enums: classes.filter((c) => c.kind === 'enum').length,
    imports: importCount,
    entryPoints,
    endpoints,
    parserErrors,
  });

  return {
    modules,
    classes,
    entryPoints: entryPoints.slice(0, 6),
    endpoints: endpoints.slice(0, 24),
    diagnostics: {
      filesScanned,
      filesSkipped,
      codeFiles,
      modules: modules.length,
      classes: classes.filter((c) => c.kind === 'class' || c.kind === 'abstract' || c.kind === 'struct').length,
      interfaces: classes.filter((c) => c.kind === 'interface' || c.kind === 'trait').length,
      enums: classes.filter((c) => c.kind === 'enum').length,
      imports: importCount,
      edges: 0,
      mermaidLengths: {},
      parserErrors,
    },
  };
}

export function analyzeFiles(files: UploadedFile[]): ProjectAnalysis {
  const pkg = parsePackageJson(files);

  const extensions: Record<string, number> = {};
  let totalLines = 0;
  let textFileCount = 0;
  for (const f of files) {
    if (f.isBinary) continue;
    textFileCount++;
    const ext = extOf(f.path) || (f.path.split('/').pop()?.includes('.') ? '' : 'no-ext');
    if (ext) extensions[ext] = (extensions[ext] ?? 0) + 1;
    if (f.content) totalLines += countLines(f.content);
  }

  const techMap = new Map<string, TechItem>();
  const addTech = (item: TechItem) => {
    if (!techMap.has(item.name)) techMap.set(item.name, item);
  };
  for (const dep of pkg?.dependencies ?? []) {
    const key = dep.toLowerCase().split('/')[0];
    if (key.includes('@') && dep.split('/').length === 2) {
      const scoped = dep.toLowerCase();
      if (TOOL_MAP[scoped]) addTech(TOOL_MAP[scoped]);
      else if (FRAMEWORK_MAP[scoped]) addTech(FRAMEWORK_MAP[scoped]);
    } else {
      const base = dep.split('/')[0].toLowerCase();
      if (FRAMEWORK_MAP[base]) addTech(FRAMEWORK_MAP[base]);
      else if (TOOL_MAP[base]) addTech(TOOL_MAP[base]);
    }
  }

  const techStack: TechItem[] = [];
  for (const item of techMap.values()) {
    if (item.kind === 'language') techStack.unshift(item);
    else techStack.push(item);
  }

  if (techStack.length === 0) {
    const lang = detectLanguage(files);
    if (lang) techStack.push({ name: lang, kind: 'language' });
  }

  const structureLines = buildStructure(files);

  const configFiles: string[] = [];
  const configNames = [
    'vite.config', 'next.config', 'nuxt.config', 'svelte.config', 'webpack.config',
    'tailwind.config', 'tsconfig.json', '.eslintrc', '.prettierrc', 'docker-compose.yml',
    'jest.config', 'vitest.config', 'cypress.config', 'playwright.config', 'go.mod',
    'requirements.txt', 'pyproject.toml', 'cargo.toml', 'composer.json',
  ];
  const allNames = new Set(files.map((f) => f.path.split('/').pop()?.toLowerCase() ?? ''));
  for (const name of configNames) {
    for (const f of files) {
      const base = f.path.split('/').pop()?.toLowerCase() ?? '';
      if (base.startsWith(name) || base === name.toLowerCase()) {
        configFiles.push(f.path);
        break;
      }
    }
  }

  const testFiles = files.filter((f) => {
    const base = f.path.split('/').pop()?.toLowerCase() ?? '';
    return (
      base.startsWith('test.') ||
      base.endsWith('.test.js') ||
      base.endsWith('.test.ts') ||
      base.endsWith('.test.tsx') ||
      base.endsWith('.spec.js') ||
      base.endsWith('.spec.ts') ||
      base.endsWith('.spec.tsx') ||
      base.startsWith('test_') ||
      base.endsWith('_test.go')
    );
  }).length;

  const codeInfo = extractCodeInfo(files);

  return {
    projectName: pkg?.name ?? null,
    description: pkg?.description ?? null,
    packageManager: detectPackageManager(files),
    language: detectLanguage(files),
    techStack,
    dependencies: pkg?.dependencies ?? [],
    license: pkg?.license ?? null,
    fileCount: files.length,
    textFileCount,
    totalLines,
    structureLines,
    extensions,
    hasDockerfile: allNames.has('dockerfile'),
    modules: codeInfo.modules,
    classes: codeInfo.classes,
    entryPoints: codeInfo.entryPoints,
    endpoints: codeInfo.endpoints,
    hasCIConfig: files.some((f) => f.path.includes('.github/') || f.path.includes('.gitlab-ci')),
    configFiles,
    testFiles,
    diagnostics: codeInfo.diagnostics,
  };
}
