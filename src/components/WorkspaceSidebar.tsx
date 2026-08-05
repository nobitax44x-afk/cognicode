import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutList, Shapes, Settings2, FileText, Code2, Braces, Workflow } from 'lucide-react';
import type { DiagramDef, ProjectAnalysis, ReadmeOptions, SectionKey } from '../types';
import { SECTION_DEFS } from '../types';

interface WorkspaceSidebarProps {
  analysis: ProjectAnalysis | null;
  options: ReadmeOptions;
  onChangeOptions: (options: ReadmeOptions) => void;
  diagrams: DiagramDef[];
  onToggleDiagram: (id: string) => void;
  onOpenSettings: () => void;
}

function DiagramIcon({ id }: { id: string }) {
  switch (id) {
    case 'class':
      return <Braces className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'flow':
      return <Workflow className="w-3.5 h-3.5" aria-hidden="true" />;
    default:
      return <Shapes className="w-3.5 h-3.5" aria-hidden="true" />;
  }
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  analysis,
  options,
  onChangeOptions,
  diagrams,
  onToggleDiagram,
  onOpenSettings,
}) => {
  const toggleSection = (key: SectionKey) => {
    const next = options.sections.includes(key)
      ? options.sections.filter((s) => s !== key)
      : [...options.sections, key];
    onChangeOptions({ ...options, sections: next });
  };

  const selectedCount = diagrams.filter((d) => d.selected).length;

  return (
    <div className="flex flex-col gap-4 p-4">
      {analysis && (
        <div className="card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-app-faint">
              Project stats
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
            <div>
              <dt className="text-[11px] text-app-faint">Files</dt>
              <dd className="text-sm font-semibold text-app-foreground">{analysis.fileCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-app-faint">Lines</dt>
              <dd className="text-sm font-semibold text-app-foreground">
                {analysis.totalLines.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-app-faint">Language</dt>
              <dd className="text-sm font-semibold text-app-foreground truncate">
                {analysis.language ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-app-faint">Endpoints</dt>
              <dd className="text-sm font-semibold text-app-foreground">{analysis.endpoints.length}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-3 w-full btn btn-secondary px-3 py-1.5 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            Full README settings
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-app-border bg-app-bg-subtle/60 px-3.5 py-2.5">
          <LayoutList className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
          <h3 className="text-xs font-semibold text-app-foreground">Sections</h3>
          <span className="ml-auto text-[11px] font-mono text-app-faint">
            {options.sections.length}/{SECTION_DEFS.length}
          </span>
        </div>
        <ul className="max-h-64 overflow-y-auto p-1.5">
          {SECTION_DEFS.map((section) => {
            const selected = options.sections.includes(section.key);
            return (
              <li key={section.key}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-app-surface-muted"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                      selected
                        ? 'border-app-accent bg-app-accent text-app-accent-foreground'
                        : 'border-app-border-strong'
                    }`}
                    aria-hidden="true"
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[13px] font-medium ${
                        selected ? 'text-app-foreground' : 'text-app-muted'
                      }`}
                    >
                      {section.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-app-border bg-app-bg-subtle/60 px-3.5 py-2.5">
          <Shapes className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
          <h3 className="text-xs font-semibold text-app-foreground">Diagrams</h3>
          <span className="ml-auto text-[11px] font-mono text-app-faint">
            {selectedCount}/{diagrams.length}
          </span>
        </div>
        <ul className="max-h-64 overflow-y-auto p-1.5">
          <AnimatePresence initial={false}>
            {diagrams.map((d) => {
              const selected = d.selected;
              return (
                <motion.li
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => onToggleDiagram(d.id)}
                    className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-app-surface-muted"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                        selected
                          ? 'border-app-accent bg-app-accent text-app-accent-foreground'
                          : 'border-app-border-strong'
                      }`}
                      aria-hidden="true"
                    >
                      {selected ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`flex items-center gap-1.5 text-[13px] font-medium ${
                          selected ? 'text-app-foreground' : 'text-app-muted'
                        }`}
                      >
                        <DiagramIcon id={d.id} />
                        {d.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-app-faint">
                        {d.description}
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <div className="flex items-start gap-1.5 border-t border-app-border px-3.5 py-2.5">
          <Code2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-app-faint" aria-hidden="true" />
          <p className="text-[11px] leading-snug text-app-faint">
            Selected diagrams are embedded as mermaid blocks in your README.
          </p>
        </div>
      </div>

      {!analysis && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-app-border px-3.5 py-3 text-xs text-app-faint">
          <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
          Upload a project to unlock sections and diagrams.
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
