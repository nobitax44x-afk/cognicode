import React from 'react';
import { Folder, ArrowRight, Sparkles } from 'lucide-react';
import type { SampleProject } from '../data/sampleProjects';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

interface ExamplesSectionProps {
  onLoadSample: (sample: SampleProject) => void;
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ onLoadSample }) => {
  return (
    <section id="examples" className="scroll-mt-24 border-t border-app-border bg-app-bg-subtle/60">
      <div className="app-container py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-foreground">
              See it in action
            </h2>
            <p className="mt-3 text-app-muted leading-relaxed">
              Load one of these sample projects to explore how a README is generated from real code —
              no upload needed.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs font-medium text-app-muted shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
            Live in your browser
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_PROJECTS.map((sample) => (
            <article key={sample.id} className="card p-6 flex flex-col">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-app-surface-muted border border-app-border text-app-muted">
                  <Folder className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-mono text-sm font-semibold text-app-foreground truncate">
                    {sample.name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-app-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: sample.color }}
                    />
                    {sample.language}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-app-muted flex-1">
                {sample.description}
              </p>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-app-border-muted">
                <span className="text-xs text-app-faint font-mono">
                  {sample.files.length} files
                </span>
                <button
                  type="button"
                  onClick={() => onLoadSample(sample)}
                  className="btn btn-secondary px-4 py-2 text-xs"
                >
                  Load example
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
