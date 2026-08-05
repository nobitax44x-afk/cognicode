import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';
import type { AIConfig, AIProvider } from '../types';
import { defaultModelFor } from '../lib/ai';

interface AssistantSettingsModalProps {
  open: boolean;
  config: AIConfig | null;
  onSave: (config: AIConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

const PROVIDER_META: Record<AIProvider, { label: string; models: string[] }> = {
  openai: { label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'] },
  anthropic: {
    label: 'Anthropic',
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-7-sonnet-latest'],
  },
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash'],
  },
};

export const AssistantSettingsModal: React.FC<AssistantSettingsModalProps> = ({
  open,
  config,
  onSave,
  onClear,
  onClose,
}) => {
  const [provider, setProvider] = useState<AIProvider>(config?.provider ?? 'openai');
  const [model, setModel] = useState<string>(config?.model ?? defaultModelFor('openai'));
  const [apiKey, setApiKey] = useState<string>(config?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState<string>(config?.baseUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (open) {
      setProvider(config?.provider ?? 'openai');
      setModel(config?.model ?? defaultModelFor(config?.provider ?? 'openai'));
      setApiKey(config?.apiKey ?? '');
      setBaseUrl(config?.baseUrl ?? '');
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 40);
    }
  }, [open, config]);

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

  const changeProvider = (next: AIProvider) => {
    setProvider(next);
    setModel((prev) => {
      if (PROVIDER_META[next].models.includes(prev)) return prev;
      return defaultModelFor(next);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Enter an API key to enable the AI assistant.');
      return;
    }
    if (!model.trim()) {
      setError('Enter a model name.');
      return;
    }
    onSave({
      provider,
      model: model.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-settings-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="card relative w-full max-w-md overflow-hidden shadow-app-xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-app-accent" aria-hidden="true" />
                <h2 id="assistant-settings-title" className="text-sm font-semibold text-app-foreground">
                  AI assistant settings
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="btn btn-ghost p-1.5 rounded-md"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="ai-provider" className="field-label">
                  Provider
                </label>
                <select
                  ref={firstInputRef}
                  id="ai-provider"
                  value={provider}
                  onChange={(e) => changeProvider(e.target.value as AIProvider)}
                  className="input appearance-none cursor-pointer"
                >
                  {(Object.keys(PROVIDER_META) as AIProvider[]).map((p) => (
                    <option key={p} value={p}>
                      {PROVIDER_META[p].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ai-model" className="field-label">
                  Model
                </label>
                <input
                  id="ai-model"
                  type="text"
                  list="ai-model-suggestions"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={defaultModelFor(provider)}
                  className="input font-mono"
                />
                <datalist id="ai-model-suggestions">
                  {PROVIDER_META[provider].models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="ai-key" className="field-label">
                  API key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-app-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="ai-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config?.apiKey ? '••••••••••••••••' : 'sk-…'}
                    autoComplete="off"
                    spellCheck={false}
                    className="input pl-9 font-mono"
                  />
                </div>
                <p className="field-hint flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Stored only in your browser. It never leaves this device.
                </p>
              </div>

              <div>
                <label htmlFor="ai-base-url" className="field-label">
                  Base URL <span className="font-normal text-app-faint">(optional)</span>
                </label>
                <input
                  id="ai-base-url"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                  className="input font-mono"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-app-danger">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                {config ? (
                  <button
                    type="button"
                    onClick={onClear}
                    className="btn btn-ghost px-2.5 py-1.5 text-xs text-app-danger hover:bg-app-danger-muted"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Remove
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onClose} className="btn btn-secondary px-3 py-1.5 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-3 py-1.5 text-xs">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssistantSettingsModal;
