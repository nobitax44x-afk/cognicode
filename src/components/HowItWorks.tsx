import React from 'react';
import { FileUp, Sparkles, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    title: 'Upload your project',
    description:
      'Drag and drop a project folder or individual files. Support for 40+ languages and zip archives.',
    icon: FileUp,
  },
  {
    title: 'Tune the details',
    description:
      'Pick the sections you need, add your own description, tech stack, install commands, and license.',
    icon: Sparkles,
  },
  {
    title: 'Generate & publish',
    description:
      'Review the Markdown and live preview, then copy or download README.md straight into your repo.',
    icon: CheckCircle2,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="border-y border-app-border bg-app-bg-subtle/60">
      <div className="app-container py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-foreground">
            From zero to documented in three steps
          </h2>
          <p className="mt-3 text-app-muted leading-relaxed">
            No sign-up, no setup. Upload your code and get a README your contributors will actually
            read.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="card p-6 relative">
                <span className="absolute top-6 right-6 text-4xl font-extrabold text-app-border-muted select-none" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-app-accent-muted text-app-accent">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-app-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-app-muted">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
