import React, { useCallback, useRef, useState } from 'react';
import {
  UploadCloud,
  FolderOpen,
  Loader2,
  X,
  AlertCircle,
  FileText,
  FileJson,
  FileCode2,
  File as FileIcon,
  ScanSearch,
} from 'lucide-react';
import JSZip from 'jszip';
import type { FileStatus, UploadedFile } from '../types';
import { formatBytes, isLikelyText, langMetaOf, makeId, readFileAsText } from '../lib/utils';

interface ProjectUploaderProps {
  files: UploadedFile[];
  status: FileStatus;
  error: string | null;
  onFilesRead: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onError: (msg: string | null) => void;
}

const MAX_FILES = 200;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 60 * 1024 * 1024;

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '__pycache__',
  '.cache',
  'coverage',
  '.vscode',
  '.idea',
  'vendor',
  'target',
]);

const SKIP_FILES = new Set(['.ds_store', 'thumbs.db']);

function shouldSkip(path: string): boolean {
  const parts = path.split('/');
  return (
    parts.some((p) => SKIP_DIRS.has(p.toLowerCase())) ||
    SKIP_FILES.has(parts[parts.length - 1]?.toLowerCase() ?? '')
  );
}

function fileIconFor(path: string): { icon: React.ElementType; color: string } {
  const meta = langMetaOf(path);
  const base = path.split('/').pop()?.toLowerCase() ?? '';
  if (base === 'readme.md' || /\.(md|mdx)$/.test(base)) return { icon: FileText, color: meta.color };
  if (base.endsWith('.json') || base === 'package-lock.json') return { icon: FileJson, color: meta.color };
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|cs|rb|php|vue|svelte)$/.test(base))
    return { icon: FileCode2, color: meta.color };
  return { icon: FileIcon, color: meta.color };
}

export const ProjectUploader: React.FC<ProjectUploaderProps> = ({
  files,
  status,
  error,
  onFilesRead,
  onRemoveFile,
  onClearFiles,
  onError,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const busy = reading || status === 'analyzing' || status === 'generating';

  const buildUploadedFiles = useCallback(
    async (raw: { file: File; path: string }[]): Promise<UploadedFile[]> => {
      const valid = raw.filter(({ file, path }) => {
        if (file.size > MAX_FILE_SIZE) return false;
        if (shouldSkip(path)) return false;
        return true;
      });

      const out: UploadedFile[] = [];
      const seen = new Set<string>();
      for (const { file, path } of valid) {
        if (seen.has(path)) continue;
        seen.add(path);
        const isBinary = !isLikelyText(path);
        let content: string | null = null;
        if (!isBinary) {
          try {
            content = await readFileAsText(file);
          } catch {
            content = null;
          }
        }
        out.push({
          id: makeId(),
          name: path.split('/').pop() ?? file.name,
          path,
          size: file.size,
          content,
          isBinary,
        });
      }
      return out;
    },
    [],
  );

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      const rawFiles = Array.from(list);
      if (rawFiles.length === 0) return;

      setProgressLabel(`Reading ${rawFiles.length} file${rawFiles.length > 1 ? 's' : ''}…`);
      setReading(true);
      try {
        const raw = rawFiles.map((f) => ({
          file: f,
          path: (f as File & { path?: string }).path || f.webkitRelativePath || f.name,
        }));
        const uploaded = await buildUploadedFiles(raw);

        if (uploaded.length === 0) {
          setProgressLabel('');
          setReading(false);
          onError('No readable files found. Please select a valid project folder or supported file types.');
          return;
        }

        if (uploaded.length > MAX_FILES) {
          setProgressLabel('');
          setReading(false);
          onError(`Too many files. Please select a smaller project (max ${MAX_FILES} files).`);
          return;
        }

        const totalSize = uploaded.reduce((sum, f) => sum + f.size, 0);
        if (totalSize > MAX_TOTAL_SIZE) {
          setProgressLabel('');
          setReading(false);
          onError(`Total upload size exceeds ${formatBytes(MAX_TOTAL_SIZE)}. Please upload a smaller project.`);
          return;
        }

        setProgressLabel('');
        setReading(false);
        onError(null);
        onFilesRead(uploaded);
      } catch {
        setProgressLabel('');
        setReading(false);
        onError('Failed to read the selected files. Please try again.');
      }
    },
    [buildUploadedFiles, onFilesRead, onError],
  );

  const handleZip = useCallback(
    async (file: File) => {
      setProgressLabel('Extracting zip archive…');
      setReading(true);
      try {
        const zip = await JSZip.loadAsync(file);
        const raw: { file: File; path: string }[] = [];
        const textEntries: { path: string; content: string }[] = [];
        for (const [path, entry] of Object.entries(zip.files)) {
          if (entry.dir) continue;
          const normalized = path.replace(/\\/g, '/');
          if (shouldSkip(normalized)) continue;
          if (isLikelyText(normalized) && entry.async) {
            const content = await entry.async('string');
            textEntries.push({ path: normalized, content });
          } else {
            raw.push({ file: new File([await entry.async('blob')], normalized.split('/').pop() ?? 'file'), path: normalized });
          }
        }

        const uploaded: UploadedFile[] = [
          ...textEntries.map(({ path, content }) => ({
            id: makeId(),
            name: path.split('/').pop() ?? path,
            path,
            size: new Blob([content]).size,
            content,
            isBinary: false,
          })),
          ...raw.map(({ path }) => ({
            id: makeId(),
            name: path.split('/').pop() ?? path,
            path,
            size: 0,
            content: null,
            isBinary: true,
          })),
        ].filter((f) => !SKIP_FILES.has(f.name.toLowerCase()));

        setProgressLabel('');
        setReading(false);
        if (uploaded.length === 0) {
          onError('No readable files found in the zip archive.');
          return;
        }
        if (uploaded.length > MAX_FILES) {
          onError(`Too many files in archive (max ${MAX_FILES}).`);
          return;
        }
        onError(null);
        onFilesRead(uploaded);
      } catch {
        setProgressLabel('');
        setReading(false);
        onError('Could not extract the zip archive. It may be corrupted or password-protected.');
      }
    },
    [onFilesRead, onError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragActive(false);
      const items = e.dataTransfer.files;
      if (items.length === 0) return;
      const zips = Array.from(items).filter((f) => f.name.toLowerCase().endsWith('.zip'));
      const others = Array.from(items).filter((f) => !f.name.toLowerCase().endsWith('.zip'));
      if (zips.length > 0) {
        void handleZip(zips[0]);
        if (others.length > 0) void handleFiles(others);
      } else {
        void handleFiles(items);
      }
    },
    [handleFiles, handleZip],
  );

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const hasFiles = files.length > 0;

  return (
    <section id="upload" className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-app-foreground">Upload your project</h2>
        <p className="mt-1 text-sm text-app-muted">
          Choose a folder, individual files, or a zip archive. Your code is analyzed entirely in your browser.
        </p>
      </div>

      <div className="card overflow-hidden">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 px-4 py-3 border-b border-app-danger/30 bg-app-danger-muted text-app-danger text-sm"
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="text-xs mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div
          role="region"
          aria-label="File upload drop zone"
          onDragEnter={(e) => {
            e.preventDefault();
            if (!busy) setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (!busy) void handleDrop(e);
          }}
          className={`relative flex flex-col items-center justify-center px-6 py-12 sm:py-16 text-center transition-colors duration-200 ${
            dragActive ? 'bg-app-accent-muted' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <span
            className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
              dragActive
                ? 'border-app-accent bg-app-accent-muted text-app-accent'
                : 'border-app-border bg-app-bg-subtle text-app-muted'
            }`}
          >
            <UploadCloud className="w-8 h-8" aria-hidden="true" />
          </span>

          <p className="mt-5 text-base font-semibold text-app-foreground">
            {dragActive ? 'Drop your files to upload' : 'Drag and drop your project here'}
          </p>
          <p className="mt-1 text-sm text-app-muted">or use one of the buttons below</p>

          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="btn btn-primary px-5 py-2.5 w-full sm:w-auto"
            >
              <UploadCloud className="w-4 h-4" aria-hidden="true" />
              Choose Files
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={busy}
              className="btn btn-secondary px-5 py-2.5 w-full sm:w-auto"
            >
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              Choose Folder
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-app-faint">
            <span>Supports 40+ file types</span>
            <span aria-hidden="true" className="text-app-border-strong">·</span>
            <span>Max {formatBytes(MAX_FILE_SIZE)} per file</span>
            <span aria-hidden="true" className="text-app-border-strong">·</span>
            <span>Zip archives welcome</span>
          </div>

          {busy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-app-surface/90 backdrop-blur-sm gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-app-accent" aria-hidden="true" />
              <p className="text-sm font-medium text-app-foreground flex items-center gap-2">
                {status === 'analyzing' ? (
                  <>
                    <ScanSearch className="w-4 h-4 text-app-accent" aria-hidden="true" />
                    Analyzing project structure…
                  </>
                ) : (
                  progressLabel || 'Reading files…'
                )}
              </p>
              <p className="text-xs text-app-faint">Your files are processed locally — nothing is uploaded</p>
            </div>
          )}
        </div>

        {hasFiles && (
          <div className="border-t border-app-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
              <p className="text-sm font-semibold text-app-foreground">
                {files.length} file{files.length > 1 ? 's' : ''} selected
                <span className="ml-2 text-xs font-normal text-app-faint">· {formatBytes(totalSize)}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost btn px-3 py-1.5 text-xs rounded-md"
                >
                  Add more
                </button>
                <button
                  type="button"
                  onClick={onClearFiles}
                  className="btn-danger btn px-3 py-1.5 text-xs rounded-md"
                >
                  Clear all
                </button>
              </div>
            </div>

            <ul className="max-h-72 overflow-y-auto border-t border-app-border divide-y divide-app-border-muted">
              {files.map((file) => {
                const { icon: Icon, color } = fileIconFor(file.path);
                return (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 px-4 sm:px-6 py-2.5 group"
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[13px] text-app-foreground" title={file.path}>
                        {file.path}
                      </p>
                      <p className="text-[11px] text-app-faint">
                        {langMetaOf(file.path).label}
                        {file.isBinary ? ' · binary' : ''}
                      </p>
                    </div>
                    <span className="text-xs text-app-faint font-mono shrink-0">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-app-faint hover:text-app-danger transition-opacity"
                      aria-label={`Remove ${file.path}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
