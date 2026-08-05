import React, { useState } from 'react';
import { Copy, Check, Download, RefreshCw, FileText } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ResultPanelProps {
  markdown: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  copied: boolean;
  generating: boolean;
}

type Tab = 'edit' | 'preview';

export const ResultPanel: React.FC<ResultPanelProps> = ({
  markdown,
  onChange,
  onCopy,
  onDownload,
  onRegenerate,
  copied,
  generating,
}) => {
  const [tab, setTab] = useState<Tab>('preview');
  const editorId = 'readme-editor-textarea';

  const switchToEditor = () => {
    setTab('edit');
    setTimeout(() => {
      document.getElementById(editorId)?.focus();
    }, 0);
  };

  return (
    <section id="result" className="scroll-mt-24" aria-labelledby="result-heading">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 id="result-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-app-foreground">
            Your README is ready
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            Edit the Markdown on the left and watch the preview update in real time.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-app-success/30 bg-app-success-muted px-3 py-1 text-xs font-medium text-app-success">
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          Generated successfully
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-app-accent shrink-0" aria-hidden="true" />
            <span className="font-mono text-sm font-semibold text-app-foreground truncate">README.md</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-app-success" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={generating}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} aria-hidden="true" />
              {generating ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button
              type="button"
              onClick={switchToEditor}
              className="btn btn-secondary px-3 py-1.5 text-xs md:hidden"
            >
              Edit
            </button>
          </div>
        </div>

        <div className="md:hidden border-b border-app-border bg-app-bg-subtle/60 px-2 py-1.5 flex gap-1" role="tablist" aria-label="Editor views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            onClick={() => setTab('preview')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'preview' ? 'bg-app-surface text-app-foreground shadow-app-xs' : 'text-app-muted'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'edit'}
            onClick={() => setTab('edit')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'edit' ? 'bg-app-surface text-app-foreground shadow-app-xs' : 'text-app-muted'
            }`}
          >
            Edit Markdown
          </button>
        </div>

        <div className="grid md:grid-cols-2 md:divide-x md:h-[40rem] divide-app-border">
          <div className={`md:block overflow-hidden ${tab === 'edit' ? 'block' : 'hidden'}`}>
            <MarkdownEditor value={markdown} onChange={onChange} textareaId={editorId} />
          </div>
          <div className={`md:block overflow-hidden ${tab === 'preview' ? 'block' : 'hidden'}`}>
            <MarkdownRenderer markdown={markdown} />
          </div>
        </div>
      </div>
    </section>
  );
};
