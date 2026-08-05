import React, { useState } from 'react';
import {
  Settings2,
  Wand2,
  Loader2,
  Plus,
  X,
  ChevronDown,
  FileText,
  ListChecks,
  Type,
  Tag,
  Terminal,
  KeyRound,
  User,
  Link2,
  AlertCircle,
} from 'lucide-react';
import type { ProjectAnalysis, ReadmeOptions, SectionKey } from '../types';
import { SECTION_DEFS } from '../types';

interface DocOptionsPanelProps {
  analysis: ProjectAnalysis | null;
  options: ReadmeOptions;
  onChange: (options: ReadmeOptions) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled: boolean;
}

const LICENSES = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'Unlicense',
  'AGPL-3.0',
  'Other',
];

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => {
  const id = `toggle-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-app-foreground cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-app-faint mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-app-accent' : 'bg-app-border-strong'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}> = ({ tags, onChange, suggestions = [] }) => {
  const [value, setValue] = useState('');

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) onChange([...tags, trimmed]);
    setValue('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 py-1.5 focus-within:border-app-accent focus-within:shadow-app-focus transition-shadow">
        {tags.map((tag) => (
          <span key={tag} className="chip" data-selected="true">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="hover:text-app-danger transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(value);
            } else if (e.key === 'Backspace' && !value && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => add(value)}
          placeholder={tags.length === 0 ? 'e.g. React, TypeScript, Vite' : 'Add another…'}
          className="min-w-[10rem] flex-1 bg-transparent text-sm text-app-foreground placeholder:text-app-faint focus:outline-none py-1"
          aria-label="Tech stack"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-app-border-muted px-2 py-0.5 text-[11px] text-app-faint hover:text-app-accent hover:border-app-accent transition-colors"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DocOptionsPanel: React.FC<DocOptionsPanelProps> = ({
  analysis,
  options,
  onChange,
  onGenerate,
  generating,
  disabled,
}) => {
  const patch = (partial: Partial<ReadmeOptions>) => onChange({ ...options, ...partial });
  const patchAdvanced = (partial: Partial<ReadmeOptions['advanced']>) =>
    patch({ advanced: { ...options.advanced, ...partial } });

  const toggleSection = (key: SectionKey) => {
    const next = options.sections.includes(key)
      ? options.sections.filter((s) => s !== key)
      : [...options.sections, key];
    patch({ sections: next });
  };

  const suggestions = (analysis?.techStack ?? []).map((t) => t.name);

  return (
    <section id="configure" className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-app-foreground">
          README configuration
        </h2>
        <p className="mt-1 text-sm text-app-muted">
          Customize the structure and content. Your detected project details are pre-filled — tweak anything.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 sm:px-7 py-4 border-b border-app-border bg-app-bg-subtle/60 flex items-center gap-2.5">
          <Settings2 className="w-4.5 h-4.5 text-app-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-app-foreground">Project details</h3>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="project-name" className="field-label">
                Project name
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="project-name"
                  type="text"
                  value={options.projectName}
                  onChange={(e) => patch({ projectName: e.target.value })}
                  placeholder={analysis?.projectName || 'e.g. my-awesome-library'}
                  className="input pl-9 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="license" className="field-label">
                License
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <select
                  id="license"
                  value={options.license}
                  onChange={(e) => patch({ license: e.target.value })}
                  className="input pl-9 appearance-none cursor-pointer"
                >
                  {LICENSES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="author" className="field-label">
                Author / maintainer
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="author"
                  type="text"
                  value={options.author}
                  onChange={(e) => patch({ author: e.target.value })}
                  placeholder="Your name"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="repo-url" className="field-label">
                Repository URL
                <span className="ml-1 text-app-faint font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="repo-url"
                  type="url"
                  value={options.repositoryUrl}
                  onChange={(e) => patch({ repositoryUrl: e.target.value })}
                  placeholder="https://github.com/you/repo"
                  className="input pl-9 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="install-command" className="field-label">
                Installation command
              </label>
              <div className="relative">
                <Terminal className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="install-command"
                  type="text"
                  value={options.installationCommand}
                  onChange={(e) => patch({ installationCommand: e.target.value })}
                  placeholder="npm install"
                  className="input pl-9 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="usage-command" className="field-label">
                Usage command
              </label>
              <div className="relative">
                <Terminal className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="usage-command"
                  type="text"
                  value={options.usageCommand}
                  onChange={(e) => patch({ usageCommand: e.target.value })}
                  placeholder="npm run dev"
                  className="input pl-9 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="usage-instructions" className="field-label">
                Usage instructions
                <span className="ml-1 text-app-faint font-normal">(optional prose)</span>
              </label>
              <textarea
                id="usage-instructions"
                rows={2}
                value={options.usageInstructions}
                onChange={(e) => patch({ usageInstructions: e.target.value })}
                placeholder="e.g. Start the development server, then open http://localhost:3000…"
                className="input resize-y"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={options.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="What does your project do? Why should someone use it?"
                className="input resize-y"
              />
              <p className="field-hint">
                {analysis?.description
                  ? 'Detected from package.json — you can edit it.'
                  : 'Used in the intro of your README.'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="field-label">
                Tech stack
                <span className="ml-1 text-app-faint font-normal">(comma-separated)</span>
              </label>
              <TagInput
                tags={options.techStack}
                onChange={(techStack) => patch({ techStack })}
                suggestions={suggestions.filter((s) => !options.techStack.includes(s)).slice(0, 8)}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-app-border pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <ListChecks className="w-4.5 h-4.5 text-app-accent" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-app-foreground">Include sections</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SECTION_DEFS.map((section) => {
                const selected = options.sections.includes(section.key);
                return (
                  <button
                    key={section.key}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleSection(section.key)}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-app-accent bg-app-accent-muted'
                        : 'border-app-border bg-app-surface hover:border-app-border-strong'
                    }`}
                  >
                    <span>
                      <span className={`block text-sm font-medium ${selected ? 'text-app-accent' : 'text-app-foreground'}`}>
                        {section.label}
                      </span>
                      <span className="block text-[11px] text-app-faint">{section.hint}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-4.5 w-4.5 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                        selected
                          ? 'border-app-accent bg-app-accent text-app-accent-foreground'
                          : 'border-app-border-strong'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <details className="mt-6 border border-app-border rounded-lg group">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 select-none hover:bg-app-bg-subtle/60 transition-colors [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-semibold text-app-foreground">
                <Settings2 className="w-4 h-4 text-app-muted" aria-hidden="true" />
                Advanced options
              </span>
              <ChevronDown className="w-4 h-4 text-app-faint transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-app-border px-4 py-2">
              <Toggle
                checked={options.advanced.includeBadges}
                onChange={(v) => patchAdvanced({ includeBadges: v })}
                label="Badges row"
                description="License, language, CI and build status badges below the title"
              />
              <Toggle
                checked={options.advanced.includeToC}
                onChange={(v) => patchAdvanced({ includeToC: v })}
                label="Table of contents"
                description="Quick navigation links at the top of the README"
              />
              <Toggle
                checked={options.advanced.showStructure}
                onChange={(v) => patchAdvanced({ showStructure: v })}
                label="Project structure"
                description="An auto-generated file tree in the Overview section"
              />
              <Toggle
                checked={options.advanced.showStats}
                onChange={(v) => patchAdvanced({ showStats: v })}
                label="Project stats"
                description="File count, lines of code, and primary language metrics"
              />
              <Toggle
                checked={options.advanced.emojiHeaders}
                onChange={(v) => patchAdvanced({ emojiHeaders: v })}
                label="Emoji section headers"
                description="Add an emoji to each section heading"
              />
            </div>
          </details>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-app-border pt-6">
            <p className="text-xs text-app-faint flex items-center gap-1.5">
              {disabled ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Upload a project first to enable generation
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  {analysis ? `${analysis.fileCount} files · ${analysis.totalLines.toLocaleString()} lines analyzed` : ''}
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onGenerate}
              disabled={disabled || generating}
              className="btn btn-primary px-6 py-3 text-[15px] w-full sm:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" aria-hidden="true" />
                  Generate README
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-1 text-xs text-app-faint">
        <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
        Tip: enable “Project structure” to give readers an instant map of your repository.
      </div>
    </section>
  );
};
