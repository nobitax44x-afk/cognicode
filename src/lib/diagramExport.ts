import type { DiagramDef } from '../types';
import { renderMermaid } from './mermaidTheme';

function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'diagram';
}

function currentTheme(): 'light' | 'dark' {
  return typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';
}

async function exportPng(svg: string, name: string): Promise<void> {
  const url = URL.createObjectURL(svgToBlob(svg));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('PNG encoding failed');
    downloadBlob(blob, `${name}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface ExportResult {
  exported: number;
  failed: number;
}

export async function exportDiagram(
  d: DiagramDef,
  format: 'svg' | 'png' = 'svg',
): Promise<void> {
  const svg = await renderMermaid(d.source, currentTheme());
  const name = toSlug(d.title);
  if (format === 'png') {
    await exportPng(svg, name);
  } else {
    downloadBlob(svgToBlob(svg), `${name}.svg`);
  }
}

export async function exportAllDiagrams(
  diagrams: DiagramDef[],
): Promise<ExportResult> {
  let exported = 0;
  let failed = 0;
  for (const d of diagrams) {
    try {
      const svg = await renderMermaid(d.source, currentTheme());
      const name = toSlug(d.title);
      downloadBlob(svgToBlob(svg), `${name}.svg`);
      await exportPng(svg, name);
      exported++;
    } catch {
      failed++;
    }
  }
  return { exported, failed };
}
