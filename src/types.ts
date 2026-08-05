export type FileStatus = 'idle' | 'reading' | 'analyzing' | 'ready' | 'generating' | 'done';

export type PipelineStep = 'upload' | 'analyze' | 'diagrams' | 'build' | 'ready';

export type DiagramKind = 'architecture' | 'class' | 'sequence' | 'flow' | 'er' | 'state';

export interface DiagramDef {
  id: string;
  kind: DiagramKind;
  title: string;
  description: string;
  source: string;
  selected: boolean;
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  isError?: boolean;
  suggested?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  content: string | null;
  isBinary: boolean;
}

export interface TechItem {
  name: string;
  kind: 'language' | 'framework' | 'tool';
}

export interface ProjectAnalysis {
  projectName: string | null;
  description: string | null;
  packageManager: string | null;
  language: string | null;
  techStack: TechItem[];
  dependencies: string[];
  license: string | null;
  fileCount: number;
  textFileCount: number;
  totalLines: number;
  structureLines: string[];
  extensions: Record<string, number>;
  hasDockerfile: boolean;
  hasCIConfig: boolean;
  configFiles: string[];
  testFiles: number;
  modules: ModuleNode[];
  classes: ClassInfo[];
  entryPoints: string[];
  endpoints: ApiEndpoint[];
  diagnostics: ParserDiagnostics;
}

export type SymbolKind = 'class' | 'abstract' | 'interface' | 'enum' | 'struct' | 'trait';

export interface MethodInfo {
  name: string;
  params: string[];
  visibility: string;
  kind: 'method' | 'constructor' | 'getter' | 'setter';
}

export interface PropertyInfo {
  name: string;
  type?: string;
  visibility: string;
}

export interface ClassInfo {
  name: string;
  file: string;
  kind: SymbolKind;
  methods: string[];
  methodInfo: MethodInfo[];
  properties: PropertyInfo[];
  superclass?: string;
  implements: string[];
  line?: number;
}

export interface ModuleNode {
  name: string;
  file: string;
  lang: string;
  dir: string;
  imports: string[];
  exports: string[];
}

export interface ParserDiagnostics {
  filesScanned: number;
  filesSkipped: number;
  codeFiles: number;
  modules: number;
  classes: number;
  interfaces: number;
  enums: number;
  imports: number;
  edges: number;
  mermaidLengths: Record<string, number>;
  parserErrors: Array<{ file: string; error: string }>;
}

export interface ApiEndpoint {
  method: string;
  path: string;
}

export const SECTION_DEFS = [
  {
    key: 'overview',
    label: 'Overview',
    hint: 'What the project is and does',
  },
  {
    key: 'features',
    label: 'Features',
    hint: 'Key capabilities and highlights',
  },
  {
    key: 'installation',
    label: 'Installation',
    hint: 'How to get started',
  },
  {
    key: 'usage',
    label: 'Usage',
    hint: 'How to use the project',
  },
  {
    key: 'configuration',
    label: 'Configuration',
    hint: 'Options and settings',
  },
  {
    key: 'api',
    label: 'API Reference',
    hint: 'Exported functions / endpoints',
  },
  {
    key: 'contributing',
    label: 'Contributing',
    hint: 'How to help out',
  },
  {
    key: 'license',
    label: 'License',
    hint: 'Legal terms',
  },
  {
    key: 'contact',
    label: 'Contact',
    hint: 'Where to reach maintainers',
  },
] as const;

export type SectionKey = (typeof SECTION_DEFS)[number]['key'];

export interface AdvancedOptions {
  includeBadges: boolean;
  includeToC: boolean;
  showStructure: boolean;
  showStats: boolean;
  emojiHeaders: boolean;
}

export interface ReadmeOptions {
  projectName: string;
  description: string;
  techStack: string[];
  sections: SectionKey[];
  installationCommand: string;
  usageCommand: string;
  usageInstructions: string;
  license: string;
  author: string;
  repositoryUrl: string;
  advanced: AdvancedOptions;
}

export const DEFAULT_OPTIONS: ReadmeOptions = {
  projectName: '',
  description: '',
  techStack: [],
  sections: ['overview', 'features', 'installation', 'usage', 'contributing', 'license'],
  installationCommand: '',
  usageCommand: '',
  usageInstructions: '',
  license: 'MIT',
  author: '',
  repositoryUrl: '',
  advanced: {
    includeBadges: true,
    includeToC: true,
    showStructure: true,
    showStats: true,
    emojiHeaders: false,
  },
};
