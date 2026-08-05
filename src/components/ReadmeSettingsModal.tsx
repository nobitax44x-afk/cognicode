import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { ProjectAnalysis, ReadmeOptions } from '../types';
import { DocOptionsPanel } from './DocOptionsPanel';

interface ReadmeSettingsModalProps {
  open: boolean;
  analysis: ProjectAnalysis | null;
  options: ReadmeOptions;
  onChange: (options: ReadmeOptions) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled: boolean;
  onClose: () => void;
}

export const ReadmeSettingsModal: React.FC<ReadmeSettingsModalProps> = ({
  open,
  analysis,
  options,
  onChange,
  onGenerate,
  generating,
  disabled,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="readme-settings-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-app-xl"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-app-border px-5 py-3.5">
              <h2 id="readme-settings-title" className="text-sm font-semibold text-app-foreground">
                README settings
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost p-1.5 rounded-md"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DocOptionsPanel
                analysis={analysis}
                options={options}
                onChange={onChange}
                onGenerate={() => {
                  onGenerate();
                  onClose();
                }}
                generating={generating}
                disabled={disabled}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReadmeSettingsModal;
