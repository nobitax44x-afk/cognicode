import React from 'react';
import { ArrowRight, FileUp, ScanSearch, Wand2, Download } from 'lucide-react';

const STEPS = [
  { label: 'Upload', description: 'Add your project files', icon: FileUp },
  { label: 'Analyze', description: 'AI inspects the structure', icon: ScanSearch },
  { label: 'Generate', description: 'A clean README is written', icon: Wand2 },
  { label: 'Download', description: 'Copy or export README.md', icon: Download },
];

export const Hero: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--app-accent-muted),transparent_65%)]"
      />

      <div className="app-container relative py-16 sm:py-24 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs font-medium text-app-muted shadow-app-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-app-success" />
          </span>
          Free, client-side · Your code never leaves your browser
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-app-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
          Create a professional GitHub README in seconds
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-app-muted sm:text-lg">
          Upload your project file or folder and instantly get a clear, well-structured{' '}
          <code className="font-mono text-[0.9em] text-app-accent bg-app-accent-muted px-1.5 py-0.5 rounded">
            README.md
          </code>{' '}
          — complete with sections, badges, and a clean layout your repository deserves.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => scrollTo('upload')}
            className="btn btn-primary px-6 py-3 text-[15px] w-full sm:w-auto"
          >
            Upload your project
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollTo('examples')}
            className="btn btn-secondary px-6 py-3 text-[15px] w-full sm:w-auto"
          >
            See examples
          </button>
        </div>

        <ol
          className="mt-14 grid w-full max-w-3xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          aria-label="How it works"
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex items-center gap-3 text-left">
                <span className="card flex h-11 w-11 shrink-0 items-center justify-center text-app-accent">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-app-foreground">
                    {index + 1}. {step.label}
                  </span>
                  <span className="block text-xs text-app-faint">{step.description}</span>
                </span>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden lg:block text-app-faint ml-auto"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
