import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Settings2,
  ShieldCheck,
  Loader2,
  Square,
  Bot,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { AIConfig, ChatMessage } from '../types';
import { streamChat } from '../lib/ai';
import { makeId } from '../lib/utils';

interface AssistantPanelProps {
  config: AIConfig | null;
  onOpenSettings: () => void;
  readme: string;
  projectSummary: string;
  onSuggest: (markdown: string) => void;
  onRegenerateDiagrams: () => void;
}

function looksLikeReadme(content: string): boolean {
  const trimmed = content.trim();
  return /^\s*#\s+\S+/.test(trimmed) && /^\s*#{1,6}\s/m.test(trimmed);
}

function systemPrompt(summary: string, readme: string): string {
  const base = [
    'You are CogniCoder, the AI assistant inside CogniCode, a README generator.',
    'You help users refine the Markdown for their project repository.',
    'When the user asks you to edit, rewrite, fix, or improve the README, respond with the ENTIRE revised README.md Markdown document, starting with "# " and preserving the user\'s content where it is already good.',
    'If the user asks you to regenerate a diagram, tell them to use the "Regenerate diagrams" button in the assistant header, since diagrams are generated from the uploaded code.',
    'Be concise in any prose before or after the Markdown.',
    `Project context: ${summary || 'No project uploaded yet.'}`,
  ];
  if (readme.trim()) {
    base.push('', 'Here is the current README.md that the user is working on:', '');
    base.push('```markdown');
    base.push(readme);
    base.push('```');
  }
  return base.join('\n');
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  config,
  onOpenSettings,
  readme,
  projectSummary,
  onSuggest,
  onRegenerateDiagrams,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || streaming) return;
    if (!config) {
      onOpenSettings();
      return;
    }

    setInput('');
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: text };
    const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: '', pending: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    const history = messages
      .filter((m) => !m.pending && !m.isError && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    let full = '';
    try {
      await streamChat({
        config,
        system: systemPrompt(projectSummary, readme),
        messages: [...history, { role: 'user' as const, content: text }],
        onToken: (delta) => {
          full += delta;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: full } : m)),
          );
        },
        signal: controller.signal,
      });
      const content = full.trim();
      const suggested = looksLikeReadme(content) ? content : undefined;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content, pending: false, suggested } : m,
        ),
      );
      if (suggested) onSuggest(suggested);
    } catch (err) {
      if (controller.signal.aborted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, pending: false } : m)),
        );
      } else {
        const detail = err instanceof Error ? err.message : 'Unknown error';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  pending: false,
                  isError: true,
                  content: `I couldn't reach the provider: ${detail}`,
                }
              : m,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const placeholder = config
    ? 'Ask me to improve your README…'
    : 'Connect your AI provider to get started';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-app-border bg-app-bg-subtle/60 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-app-muted">
          <Sparkles className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
          AI assistant
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRegenerateDiagrams}
            disabled={streaming}
            className="btn btn-ghost px-2 py-1 text-[11px]"
            title="Regenerate diagrams from the current README"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Diagrams
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn btn-ghost p-1.5 rounded-md"
            aria-label="AI assistant settings"
            title="AI settings"
          >
            <Settings2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!config && (
        <div className="px-4 pt-4">
          <div className="card border-app-accent/30 bg-app-accent-muted/40 p-3.5">
            <p className="text-xs font-semibold text-app-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-app-accent" aria-hidden="true" />
              Private by design
            </p>
            <p className="mt-1 text-[11px] leading-snug text-app-muted">
              Bring your own OpenAI, Anthropic or Gemini key. It is stored only in your browser and
              never leaves this device.
            </p>
            <button type="button" onClick={onOpenSettings} className="mt-2.5 btn btn-primary px-3 py-1.5 text-xs">
              Connect a provider
            </button>
          </div>
        </div>
      )}

      {config && (
        <div className="flex items-center gap-1.5 border-b border-app-border px-4 py-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface px-2 py-0.5 font-mono text-[10px] text-app-muted">
            <Bot className="w-3 h-3" aria-hidden="true" />
            {config.provider} · {config.model}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-app-faint">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            Key stays in your browser
          </span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-accent-muted text-app-accent">
                  <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-app-accent text-app-accent-foreground rounded-br-sm'
                    : m.isError
                      ? 'bg-app-danger-muted text-app-danger border border-app-danger/20 rounded-bl-sm'
                      : 'bg-app-surface-muted text-app-foreground border border-app-border-muted rounded-bl-sm'
                }`}
              >
                <span className="whitespace-pre-wrap break-words">{m.content || '\u00a0'}</span>
                {m.pending && (
                  <span className="ml-0.5 inline-flex items-center gap-1 text-app-faint">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  </span>
                )}
              </div>
              {m.role === 'user' && (
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-surface-muted text-app-muted">
                  <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form
        className="border-t border-app-border bg-app-bg-subtle/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder={placeholder}
            aria-label="Message the AI assistant"
            className="input resize-none"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="btn btn-secondary p-2.5 shrink-0"
              aria-label="Stop streaming"
            >
              <Square className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!config || !input.trim()}
              className="btn btn-primary p-2.5 shrink-0"
              aria-label="Send message"
            >
              {!config ? <AlertCircle className="w-4 h-4" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            </button>
          )}
        </div>
        {streaming && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-app-faint">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            Streaming response…
          </p>
        )}
      </form>
    </div>
  );
};

export default AssistantPanel;
