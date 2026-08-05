import React, { useEffect, useRef, useState } from 'react';
import { Download, FileCode2, Image as ImageIcon, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { renderMermaidCached } from '../lib/mermaidRenderer';
import { exportDiagram } from '../lib/diagramExport';

interface MermaidViewerProps {
  source: string;
  title?: string;
  exportName?: string;
  showExport?: boolean;
  className?: string;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({
  source,
  title,
  exportName = 'diagram',
  showExport = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [exporting, setExporting] = useState<'svg' | 'png' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(null);
    setShowSource(false);

    renderMermaidCached(source, theme)
      .then((rendered) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = typeof err === 'string' ? err : (err?.message as string | undefined) ?? 'Failed to render diagram';
        setError(msg.replace(/^Error:\s*/i, '').split('\n')[0]);
      });

    return () => {
      cancelled = true;
    };
  }, [source, theme]);

  const name = exportName.replace(/[^a-z0-9-_]+/gi, '-');

  const handleExport = async (format: 'svg' | 'png') => {
    setExporting(format);
    try {
      await exportDiagram({ id: name, kind: 'flow', title: exportName, description: '', source, selected: true }, format);
    } catch {
      /* export failure is surfaced by the toast at the actions level */
    } finally {
      setExporting(null);
    }
  };

  return (
    <div ref={rootRef} className={className}>
      {showExport && svg && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? (
            <span className="text-xs font-semibold text-app-muted truncate">{title}</span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleExport('svg')}
              disabled={exporting !== null}
              className="btn btn-ghost px-2 py-1 text-[11px]"
            >
              <FileCode2 className="w-3.5 h-3.5" aria-hidden="true" />
              SVG
            </button>
            <button
              type="button"
              onClick={() => void handleExport('png')}
              disabled={exporting !== null}
              className="btn btn-ghost px-2 py-1 text-[11px]"
            >
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              PNG
            </button>
            <button
              type="button"
              onClick={() => void handleExport('svg')}
              disabled={exporting !== null}
              className="btn btn-ghost px-2 py-1 text-[11px]"
              aria-label="Download diagram"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {!svg && !error && (
        <div className="flex items-center justify-center gap-2 py-10 text-app-faint">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="text-xs">Rendering diagram…</span>
        </div>
      )}

      {error && (
        <div className="overflow-hidden rounded-lg border border-app-danger/30 bg-app-danger-muted">
          <div className="flex items-start gap-2 px-3 py-2.5 text-app-danger">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Could not render diagram</p>
              <p className="text-[11px] mt-0.5 break-words">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSource((v) => !v)}
              className="btn btn-ghost px-2 py-1 text-[11px] shrink-0"
              aria-expanded={showSource}
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              {showSource ? 'Hide source' : 'View source'}
            </button>
          </div>
          {showSource && (
            <pre className="max-h-64 overflow-auto border-t border-app-danger/20 bg-app-bg-subtle px-3 py-2.5 font-mono text-[11px] leading-relaxed text-app-foreground">
              {source}
            </pre>
          )}
        </div>
      )}

      {svg && (
        <div className="overflow-x-auto" aria-label={title ?? exportName}>
          <div className="mx-auto w-max min-w-full text-center">
            <div
              className="inline-block max-w-full align-top"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidViewer;
