import type { DiagramDef, ProjectAnalysis, ReadmeOptions } from '../types';

const SECTION_EMOJIS: Record<string, string> = {
  overview: '📖',
  features: '✨',
  installation: '🚀',
  usage: '💻',
  configuration: '⚙️',
  api: '🔌',
  contributing: '🤝',
  license: '📄',
  contact: '💬',
};

function heading(text: string, useEmoji: boolean, emoji?: string): string {
  return `## ${useEmoji && emoji ? `${emoji} ` : ''}${text}`;
}

function installHint(pm: string | null, analysis: ProjectAnalysis): string {
  switch (pm) {
    case 'bun':
      return '```bash\nbun install\n```';
    case 'pnpm':
      return '```bash\npnpm install\n```';
    case 'yarn':
      return '```bash\nyarn\n```';
    case 'npm':
      return '```bash\nnpm install\n```';
    case 'cargo':
      return '```bash\ncargo build --release\n```';
    case 'go':
      return '```bash\ngo build ./...\n```';
    case 'pip':
      return '```bash\npip install -r requirements.txt\n```';
    default:
      return analysis.hasDockerfile
        ? '```bash\ndocker build -t project .\n```'
        : '```bash\nnpm install\n```';
  }
}

function featuresFrom(analysis: ProjectAnalysis): string[] {
  const features: string[] = [];
  const names = analysis.techStack.map((t) => t.name.toLowerCase());
  if (analysis.language) {
    features.push(`Built with **${analysis.language}** — a robust, typed foundation`);
  }
  if (names.includes('react')) features.push('Reactive UI built on **React**');
  if (names.includes('next.js')) features.push('Server-rendered pages and API routes with **Next.js**');
  if (names.includes('vite')) features.push('Lightning-fast development experience powered by **Vite**');
  if (names.includes('typescript') || names.some((n) => n === 'typescript')) {
    features.push('Type-safe APIs and components written in **TypeScript**');
  }
  if (analysis.packageManager) {
    features.push(`Managed with **${analysis.packageManager}** for reproducible installs`);
  }
  if (analysis.testFiles > 0) {
    features.push(`Covered by **${analysis.testFiles}** test file${analysis.testFiles > 1 ? 's' : ''}`);
  }
  if (analysis.hasCIConfig) features.push('Continuous integration wired through GitHub Actions');
  if (analysis.hasDockerfile) features.push('Containerized with a ready-to-use **Dockerfile**');
  features.push('Clean, well-organized project structure that is easy to extend');
  return features;
}

function renderStats(analysis: ProjectAnalysis): string {
  const rows: string[] = [];
  if (analysis.fileCount > 0) rows.push(`| Files | **${analysis.fileCount}** |`);
  if (analysis.totalLines > 0) rows.push(`| Lines of code | **${analysis.totalLines.toLocaleString()}** |`);
  if (analysis.language) rows.push(`| Primary language | **${analysis.language}** |`);
  if (analysis.packageManager) rows.push(`| Package manager | **${analysis.packageManager}** |`);
  if (analysis.testFiles > 0) rows.push(`| Test files | **${analysis.testFiles}** |`);
  if (rows.length === 0) return '';
  return `
| Metric | Value |
| --- | --- |
${rows.join('\n')}
`;
}

function renderBadges(analysis: ProjectAnalysis, options: ReadmeOptions): string {
  const badges: string[] = [];
  const license = options.license || analysis.license;
  if (license && license !== 'Other') {
    badges.push(
      `[![License](https://img.shields.io/badge/License-${encodeURIComponent(license)}-yellow.svg)](LICENSE)`,
    );
  }
  const lang = analysis.language;
  if (lang) {
    badges.push(`![Language](https://img.shields.io/badge/language-${encodeURIComponent(lang).replace(/%20/g, '_')}-3178c6.svg)`);
  }
  if (analysis.packageManager) {
    badges.push(`![Manager](https://img.shields.io/badge/package_manager-${analysis.packageManager}-brightgreen.svg)`);
  }
  if (analysis.hasCIConfig) {
    badges.push('![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088ff.svg)');
  }
  badges.push('![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)');
  if (badges.length === 0) return '';
  return badges.join(' ');
}

function renderToC(options: ReadmeOptions, diagramTitles: string[]): string {
  const items = options.sections.map((key) => {
    const label = key === 'api' ? 'API Reference' : key.charAt(0).toUpperCase() + key.slice(1);
    return `- [${label}](#${label.toLowerCase().replace(/ /g, '-')})`;
  });
  for (const title of diagramTitles) {
    items.push(`- [${title}](#${title.toLowerCase().replace(/ /g, '-')})`);
  }
  return items.join('\n');
}

export function generateReadme(
  analysis: ProjectAnalysis,
  options: ReadmeOptions,
  diagrams: DiagramDef[] = [],
): string {
  const useEmoji = options.advanced.emojiHeaders;
  const name = options.projectName.trim() || analysis.projectName || 'Your Project Name';
  const description =
    options.description.trim() ||
    analysis.description ||
    'A description of your project goes here. Upload your files and this will be generated automatically.';
  const techList = options.techStack.filter(Boolean);
  const techLine =
    techList.length > 0
      ? techList.join(', ')
      : analysis.techStack.map((t) => t.name).join(', ') || 'Your tech stack here';
  const installCmd =
    options.installationCommand.trim() || installHint(analysis.packageManager, analysis);
  const usageCmd = options.usageCommand.trim();
  const license = options.license || analysis.license || 'MIT';
  const author = options.author.trim();
  const repo = options.repositoryUrl.trim();
  const sections = options.sections;
  const selectedDiagrams = diagrams.filter((d) => d.selected);
  const lines: string[] = [];

  lines.push(`# ${name}`);
  lines.push('');

  if (options.advanced.includeBadges) {
    const badges = renderBadges(analysis, options);
    if (badges) {
      lines.push(badges);
      lines.push('');
    }
  }

  lines.push(description);
  lines.push('');

  lines.push('---');
  lines.push('');

  if (options.advanced.includeToC && sections.length > 0) {
    lines.push(heading('Table of Contents', useEmoji, '🗂️'));
    lines.push('');
    lines.push(renderToC(options, selectedDiagrams.map((d) => d.title)));
    lines.push('');
  }

  if (sections.includes('overview')) {
    lines.push(heading('Overview', useEmoji, SECTION_EMOJIS.overview));
    lines.push('');
    lines.push(`**${name}** — ${description}`);
    lines.push('');
    lines.push(`Built with **${techLine}** and designed to be simple to use, extend, and maintain.`);
    lines.push('');

    if (options.advanced.showStats) {
      const stats = renderStats(analysis);
      if (stats) {
        lines.push(stats.trim());
        lines.push('');
      }
    }

    if (options.advanced.showStructure && analysis.structureLines.length > 0) {
      lines.push('Project structure:');
      lines.push('');
      lines.push('```text');
      lines.push(...analysis.structureLines);
      lines.push('```');
      lines.push('');
    }
  }

  for (const d of selectedDiagrams) {
    lines.push(heading(d.title, useEmoji));
    lines.push('');
    lines.push(d.description || '');
    lines.push('');
    lines.push('```mermaid');
    lines.push(d.source);
    lines.push('```');
    lines.push('');
  }

  if (sections.includes('features')) {
    lines.push(heading('Features', useEmoji, SECTION_EMOJIS.features));
    lines.push('');
    const features = featuresFrom(analysis);
    for (const f of features) lines.push(`- ${f}`);
    lines.push('');
  }

  if (sections.includes('installation')) {
    lines.push(heading('Installation', useEmoji, SECTION_EMOJIS.installation));
    lines.push('');
    lines.push('### Prerequisites');
    lines.push('');
    lines.push('- [Node.js](https://nodejs.org/) 18+ (or the runtime for your stack)');
    lines.push('');
    lines.push('### Getting started');
    lines.push('');
    lines.push('Clone the repository and install dependencies:');
    lines.push('');
    lines.push('```bash');
    lines.push('git clone https://github.com/nobitax44x-afk/cognicode.git');
    lines.push('cd cognicode');
    lines.push('```');
    lines.push('');
    lines.push(installCmd);
    lines.push('');
  }

  if (sections.includes('usage')) {
    lines.push(heading('Usage', useEmoji, SECTION_EMOJIS.usage));
    lines.push('');
    if (options.usageInstructions.trim()) {
      lines.push(options.usageInstructions.trim());
      lines.push('');
    }
    if (usageCmd) {
      lines.push('```bash');
      lines.push(usageCmd);
      lines.push('```');
    } else {
      lines.push('```bash');
      lines.push('npm run start');
      lines.push('```');
    }
    lines.push('');
    lines.push('> Customize this section with real usage examples and output samples.');
    lines.push('');
  }

  if (sections.includes('configuration')) {
    lines.push(heading('Configuration', useEmoji, SECTION_EMOJIS.configuration));
    lines.push('');
    if (analysis.configFiles.length > 0) {
      lines.push('The project can be customized through the following files:');
      lines.push('');
      for (const cfg of analysis.configFiles) lines.push(`- \`${cfg}\``);
      lines.push('');
    } else {
      lines.push('Describe the available configuration options here:');
      lines.push('');
      lines.push('| Option | Default | Description |');
      lines.push('| --- | --- | --- |');
      lines.push('| `PORT` | `3000` | The port the server listens on |');
      lines.push('');
    }
  }

  if (sections.includes('api')) {
    lines.push(heading('API Reference', useEmoji, SECTION_EMOJIS.api));
    lines.push('');
    lines.push('### Endpoints');
    lines.push('');
    lines.push('| Method | Path | Description |');
    lines.push('| --- | --- | --- |');
    lines.push('| `GET` | `/api/items` | List all items |');
    lines.push('| `POST` | `/api/items` | Create a new item |');
    lines.push('| `GET` | `/api/items/:id` | Fetch a single item |');
    lines.push('');
    lines.push('> Replace these examples with the actual public API surface of your project.');
    lines.push('');
  }

  if (sections.includes('contributing')) {
    lines.push(heading('Contributing', useEmoji, SECTION_EMOJIS.contributing));
    lines.push('');
    lines.push('Contributions are welcome! To get started:');
    lines.push('');
    lines.push('1. Fork the repository');
    lines.push('2. Create your feature branch (`git checkout -b feature/amazing-feature`)');
    lines.push('3. Commit your changes (`git commit -m "Add amazing feature"`)');
    lines.push('4. Push to the branch (`git push origin feature/amazing-feature`)');
    lines.push('5. Open a Pull Request');
    lines.push('');
    lines.push('Please make sure your code follows the existing style and passes all tests.');
    lines.push('');
  }

  if (sections.includes('license')) {
    lines.push(heading('License', useEmoji, SECTION_EMOJIS.license));
    lines.push('');
    lines.push(`Distributed under the **${license}** license. See \`LICENSE\` for more information.`);
    lines.push('');
  }

  if (sections.includes('contact')) {
    lines.push(heading('Contact', useEmoji, SECTION_EMOJIS.contact));
    lines.push('');
    if (author && repo) {
      lines.push(`- **Author:** ${author}`);
      lines.push(`- **Repository:** [${repo}](${repo})`);
    } else if (author) {
      lines.push(`- **Author:** ${author}`);
    } else if (repo) {
      lines.push(`- **Repository:** [${repo}](${repo})`);
    } else {
      lines.push('- **Maintainer:** Your Name — [you@example.com](mailto:you@example.com)');
      lines.push('- **Project link:** [GitHub](https://github.com/BornilMahmud)');
    }
    lines.push('');
  }

  let result = lines.join('\n');
  const footer = `\n---\n\n<p align="center">Generated with <a href="https://github.com/BornilMahmud">CogniCode</a> · Built by <a href="https://github.com/BornilMahmud">Nightmare</a></p>\n`;
  result += footer;

  return result.trimEnd() + '\n';
}


