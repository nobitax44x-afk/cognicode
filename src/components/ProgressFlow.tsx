import React from 'react';
import { motion } from 'motion/react';
import { Upload, ScanSearch, Shapes, Hammer, CheckCircle2 } from 'lucide-react';
import type { PipelineStep } from '../types';

interface ProgressFlowProps {
  current: PipelineStep;
}

const STEPS: Array<{ key: PipelineStep; label: string; icon: React.ReactNode }> = [
  { key: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" aria-hidden="true" /> },
  { key: 'analyze', label: 'Analyze', icon: <ScanSearch className="w-4 h-4" aria-hidden="true" /> },
  { key: 'diagrams', label: 'Diagrams', icon: <Shapes className="w-4 h-4" aria-hidden="true" /> },
  { key: 'build', label: 'Build README', icon: <Hammer className="w-4 h-4" aria-hidden="true" /> },
  { key: 'ready', label: 'Ready', icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> },
];

const order: PipelineStep[] = ['upload', 'analyze', 'diagrams', 'build', 'ready'];
const currentIndex = (step: PipelineStep) => order.indexOf(step);

export const ProgressFlow: React.FC<ProgressFlowProps> = ({ current }) => {
  const idx = currentIndex(current);
  const progress = idx < 0 ? 0 : (idx / (order.length - 1)) * 100;

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={order.length - 1}
      aria-valuenow={Math.max(idx, 0)}
      aria-label="README generation progress"
    >
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-[3px] -translate-y-1/2 rounded-full bg-app-surface-muted" />
        <motion.div
          className="absolute top-5 left-0 h-[3px] -translate-y-1/2 rounded-full bg-app-accent"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        <div className="relative flex items-start justify-between">
          {STEPS.map((step, i) => {
            const state = i < idx ? 'done' : i === idx ? 'active' : 'pending';
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    state === 'done'
                      ? 'border-app-accent bg-app-accent text-app-accent-foreground'
                      : state === 'active'
                        ? 'border-app-accent bg-app-surface text-app-accent shadow-app-focus'
                        : 'border-app-border bg-app-surface-muted text-app-faint'
                  }`}
                  animate={
                    state === 'active'
                      ? { scale: [1, 1.08, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 1.2, repeat: state === 'active' ? Infinity : 0, ease: 'easeInOut' }}
                >
                  {state === 'done' ? (
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    step.icon
                  )}
                </motion.div>
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    state === 'pending' ? 'text-app-faint' : 'text-app-muted'
                  } ${state === 'active' ? 'text-app-accent' : ''}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressFlow;
