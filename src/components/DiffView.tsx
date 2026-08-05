import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check, X, GitCompareArrows } from 'lucide-react';

interface DiffViewProps {
  original: string;
  suggested: string;
  onAccept: () => void;
  onReject: () => void;
}

type DiffLine = { type: 'add' | 'del' | 'same'; text: string };

function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const n = aLines.length;
  const m = bLines.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        aLines[i] === bLines[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      out.push({ type: 'same', text: aLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: aLines[i] });
      i++;
    } else {
      out.push({ type: 'add', text: bLines[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'del', text: aLines[i++] });
  while (j < m) out.push({ type: 'add', text: bLines[j++] });
  return out;
}

export const DiffView: React.FC<DiffViewProps> = ({ original, suggested, onAccept, onReject }) => {
  const diff = useMemo(() => diffLines(original, suggested), [original, suggested]);
  const additions = diff.filter((l) => l.type === 'add').length;
  const removals = diff.filter((l) => l.type === 'del').length;

  return (
    <motion.div
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-app-border bg-app-bg-subtle/60 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-app-foreground">
          <GitCompareArrows className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
          AI suggestion
          <span className="ml-1 font-mono text-[11px] text-app-success">+{additions}</span>
          <span className="font-mono text-[11px] text-app-danger">-{removals}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onReject} className="btn btn-secondary px-2.5 py-1.5 text-xs">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Reject
          </button>
          <button type="button" onClick={onAccept} className="btn btn-primary px-2.5 py-1.5 text-xs">
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Accept
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-auto bg-app-bg-subtle font-mono text-[12px] leading-5">
        {diff.map((line, idx) => {
          const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
          const bg =
            line.type === 'add'
              ? 'bg-app-success-muted text-app-success'
              : line.type === 'del'
                ? 'bg-app-danger-muted text-app-danger'
                : 'text-app-muted';
          return (
            <div key={idx} className={`flex px-3 ${bg}`}>
              <span className="w-5 shrink-0 select-none text-app-faint">{prefix}</span>
              <span className="whitespace-pre-wrap break-all min-w-0 flex-1">{line.text || ' '}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DiffView;
