import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye } from 'lucide-react';
import { MermaidViewer } from './MermaidViewer';

interface MarkdownRendererProps {
  markdown: string;
  title?: string;
}

const MermaidBlock: React.FC<{ source: string }> = ({ source }) => (
  <div className="mermaid-block">
    <MermaidViewer source={source} className="w-full" />
  </div>
);

const components = {
  pre({ children }: { children?: React.ReactNode }) {
    if (React.isValidElement(children)) {
      const code = children as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;
      const className = code.props.className ?? '';
      if (typeof className === 'string' && className.includes('language-mermaid')) {
        const source = String(code.props.children ?? '').replace(/\n$/, '');
        return <MermaidBlock source={source} />;
      }
    }
    return <pre>{children}</pre>;
  },
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown, title }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-app-border bg-app-bg-subtle/60 px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-app-muted">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          {title ?? 'Preview'}
        </span>
        <span className="text-[11px] text-app-faint">Rendered as GitHub would show it</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-app-surface px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-none md-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
