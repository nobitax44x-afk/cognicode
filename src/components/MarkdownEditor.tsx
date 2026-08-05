import React from 'react';
import { Type, Hash } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaId?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, textareaId }) => {
  const lines = value.length > 0 ? value.split('\n').length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-app-border bg-app-bg-subtle/60 px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-app-muted">
          <Type className="w-3.5 h-3.5" aria-hidden="true" />
          Markdown
        </span>
        <span className="flex items-center gap-3 text-[11px] font-mono text-app-faint">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" aria-hidden="true" />
            {lines} lines
          </span>
          <span>{value.length.toLocaleString()} chars</span>
        </span>
      </div>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label="Markdown editor"
        className="flex-1 min-h-[28rem] w-full resize-none bg-app-bg-subtle px-4 py-3 font-mono text-[13px] leading-6 text-app-foreground placeholder:text-app-faint focus:outline-none"
      />
    </div>
  );
};
