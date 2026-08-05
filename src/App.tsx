import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { ProjectUploader } from './components/ProjectUploader';
import { ExamplesSection } from './components/ExamplesSection';
import { Footer } from './components/Footer';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { AssistantSettingsModal } from './components/AssistantSettingsModal';
import { ReadmeSettingsModal } from './components/ReadmeSettingsModal';
import { ToastProvider, useToast } from './components/Toast';
import { analyzeFiles } from './lib/analyzer';
import { generateReadme } from './lib/generator';
import { generateDiagrams } from './lib/diagrams';
import { copyText, downloadText, formatBytes, makeId, slugify } from './lib/utils';
import { exportAllDiagrams } from './lib/diagramExport';
import { useAiConfig } from './hooks/useAiConfig';
import { useAuth } from './hooks/useAuth';
import type {
  DiagramDef,
  FileStatus,
  PipelineStep,
  ProjectAnalysis,
  ReadmeOptions,
  UploadedFile,
} from './types';
import { DEFAULT_OPTIONS } from './types';
import type { SampleProject } from './data/sampleProjects';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function rootDirOf(files: UploadedFile[]): string | null {
  const first = files[0]?.path;
  if (!first) return null;
  const parts = first.split('/');
  return parts.length > 1 ? parts[0] : null;
}

function inferCommands(analysis: ProjectAnalysis): { install: string; usage: string } {
  const pm = analysis.packageManager;
  let install = 'npm install';
  if (pm === 'yarn') install = 'yarn';
  else if (pm === 'pnpm') install = 'pnpm install';
  else if (pm === 'bun') install = 'bun install';
  else if (pm === 'cargo') install = 'cargo build --release';
  else if (pm === 'go') install = 'go build ./...';
  else if (pm === 'pip') install = 'pip install -r requirements.txt';

  let usage = 'npm run start';
  if (analysis.configFiles.some((f) => f.includes('vite'))) usage = 'npm run dev';
  else if (pm === 'cargo') usage = 'cargo run';
  else if (pm === 'go') usage = 'go run .';
  else if (pm === 'pip') usage = 'uvicorn app.main:app --reload';

  return { install, usage };
}

function projectSummaryOf(analysis: ProjectAnalysis): string {
  const parts = [
    analysis.projectName || 'Unnamed project',
    analysis.description || undefined,
    analysis.language ? `Language: ${analysis.language}` : undefined,
    `${analysis.fileCount} files, ${analysis.totalLines.toLocaleString()} lines`,
    analysis.entryPoints[0] ? `Entry point: ${analysis.entryPoints[0]}` : undefined,
    analysis.endpoints.length > 0
      ? `Detected endpoints: ${analysis.endpoints.slice(0, 6).map((e) => `${e.method} ${e.path}`).join(', ')}`
      : undefined,
  ].filter(Boolean);
  return parts.join('\n');
}

const AppInner: React.FC = () => {
  const toast = useToast();
  const { config: aiConfig, save: saveAiConfig, clear: clearAiConfig } = useAiConfig();

  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<FileStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [options, setOptions] = useState<ReadmeOptions>({ ...DEFAULT_OPTIONS });
  const [diagrams, setDiagrams] = useState<DiagramDef[]>([]);
  const [readme, setReadme] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineStep>('upload');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const pendingRef = useRef<
    | { kind: 'files'; incoming: UploadedFile[] }
    | { kind: 'sample'; sample: SampleProject }
    | null
  >(null);

  useEffect(() => {
    if (view === 'workspace' && !user && !authLoading) setView('landing');
  }, [view, user, authLoading]);

  const runAnalysis = useCallback(
    async (nextFiles: UploadedFile[], prefill = true) => {
      setStatus('analyzing');
      setPipeline('analyze');
      await delay(700);
      const result = analyzeFiles(nextFiles);
      const diags = generateDiagrams(result, nextFiles);
      setAnalysis(result);
      setDiagrams(diags);
      setPipeline('diagrams');

      if (prefill) {
        const inferred = inferCommands(result);
        setOptions((prev) => ({
          ...prev,
          projectName: result.projectName || rootDirOf(nextFiles) || prev.projectName,
          description: result.description || prev.description,
          techStack:
            prev.techStack.length > 0
              ? prev.techStack
              : result.techStack.map((t) => t.name),
          installationCommand: prev.installationCommand || inferred.install,
          usageCommand: prev.usageCommand || inferred.usage,
        }));
      }

      setStatus('ready');
    },
    [],
  );

  const commitUpload = useCallback(
    async (incoming: UploadedFile[]) => {
      const merged = [...files];
      for (const f of incoming) {
        if (!merged.some((m) => m.path === f.path)) merged.push(f);
      }
      setFiles(merged);
      setGenerated(false);
      setReadme('');
      setSuggestion(null);
      await runAnalysis(merged);
      setView('workspace');
      toast.success(
        'Project analyzed',
        `${incoming.length} file${incoming.length > 1 ? 's' : ''} detected. Diagrams generated — review and generate your README.`,
      );
    },
    [files, runAnalysis, toast],
  );

  const handleFilesRead = useCallback(
    async (incoming: UploadedFile[]) => {
      if (!user) {
        pendingRef.current = { kind: 'files', incoming };
        setAuthOpen(true);
        return;
      }
      await commitUpload(incoming);
    },
    [user, commitUpload],
  );

  const handleRemoveFile = useCallback(
    async (id: string) => {
      const remaining = files.filter((f) => f.id !== id);
      setFiles(remaining);
      if (remaining.length === 0) {
        setAnalysis(null);
        setDiagrams([]);
        setOptions({ ...DEFAULT_OPTIONS });
        setReadme('');
        setGenerated(false);
        setSuggestion(null);
        setStatus('idle');
        setPipeline('upload');
      } else {
        setGenerated(false);
        setReadme('');
        setSuggestion(null);
        await runAnalysis(remaining, false);
      }
    },
    [files, runAnalysis],
  );

  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setAnalysis(null);
    setDiagrams([]);
    setOptions({ ...DEFAULT_OPTIONS });
    setReadme('');
    setGenerated(false);
    setSuggestion(null);
    setStatus('idle');
    setPipeline('upload');
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (files.length === 0 || !analysis) {
      toast.error('No project loaded', 'Upload a project before generating your README.');
      return;
    }
    setStatus('generating');
    setPipeline('build');
    await delay(900);
    const markdown = generateReadme(analysis, options, diagrams);
    setReadme(markdown);
    setGenerated(true);
    setPipeline('ready');
    setCopied(false);
    setStatus('done');
    toast.success('README generated', 'Your README.md is ready to copy or download.');
  }, [files, analysis, options, diagrams, toast]);

  const handleToggleDiagram = useCallback(
    (id: string) => {
      setDiagrams((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d));
        if (generated && analysis) {
          setReadme(generateReadme(analysis, options, next));
        }
        return next;
      });
    },
    [generated, analysis, options],
  );

  const handleRegenerateDiagrams = useCallback(() => {
    if (!analysis) return;
    const next = generateDiagrams(analysis, files);
    setDiagrams(next);
    if (generated) {
      setReadme(generateReadme(analysis, options, next));
    }
    toast.success('Diagrams regenerated', 'Refreshed from the current project analysis.');
  }, [analysis, files, generated, options, toast]);

  const handleCopy = useCallback(async () => {
    if (!readme) return;
    await copyText(readme);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard', 'Paste it into your repository.');
  }, [readme, toast]);

  const handleDownload = useCallback(() => {
    if (!readme) return;
    const name = options.projectName.trim() || 'README';
    downloadText(readme, `${slugify(name)}-README.md`);
    toast.success('Downloaded', `${name} README.md saved to your device.`);
  }, [readme, options.projectName, toast]);

  const handleExportDiagrams = useCallback(async () => {
    const selected = diagrams.filter((d) => d.selected);
    if (selected.length === 0) {
      toast.error('No diagrams selected', 'Enable at least one diagram type in the left panel first.');
      return;
    }
    const { exported, failed } = await exportAllDiagrams(selected);
    if (exported > 0) {
      toast.success(
        'Diagrams exported',
        `${exported} diagram${exported > 1 ? 's' : ''} saved as SVG + PNG${failed > 0 ? ` (${failed} failed)` : ''}.`,
      );
    } else if (failed > 0) {
      toast.error('Export failed', 'None of the selected diagrams could be rendered.');
    }
  }, [diagrams, toast]);

  const handleAcceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    setReadme(suggestion);
    setSuggestion(null);
    toast.success('Suggestion applied', 'Your README was updated with the AI changes.');
  }, [suggestion, toast]);

  const handleRejectSuggestion = useCallback(() => {
    setSuggestion(null);
    toast.info('Suggestion dismissed', 'The README was left unchanged.');
  }, [toast]);

  const loadSample = useCallback(
    async (sample: SampleProject) => {
      const uploaded: UploadedFile[] = sample.files.map((f) => ({
        id: makeId(),
        name: f.path.split('/').pop() ?? f.path,
        path: f.path,
        size: new Blob([f.content]).size,
        content: f.content,
        isBinary: false,
      }));
      setFiles(uploaded);
      setGenerated(false);
      setReadme('');
      setSuggestion(null);
      setError(null);
      await runAnalysis(uploaded);
      setView('workspace');
      toast.info(
        'Example loaded',
        `${sample.name} loaded (${uploaded.length} files). Diagrams generated.`,
      );
    },
    [runAnalysis, toast],
  );

  const handleLoadSample = useCallback(
    async (sample: SampleProject) => {
      if (!user) {
        pendingRef.current = { kind: 'sample', sample };
        setAuthOpen(true);
        return;
      }
      await loadSample(sample);
    },
    [user, loadSample],
  );

  const handleAuthSuccess = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending?.kind === 'files') void commitUpload(pending.incoming);
    else if (pending?.kind === 'sample') void loadSample(pending.sample);
  }, [commitUpload, loadSample]);

  const projectName = options.projectName.trim() || analysis?.projectName || 'Unnamed project';
  const totalUploadSize = files.reduce((sum, f) => sum + f.size, 0);

  if (view === 'workspace' && analysis) {
    return (
      <>
        <WorkspaceLayout
          projectName={projectName}
          pipeline={pipeline}
          analysis={analysis}
          options={options}
          onChangeOptions={setOptions}
          diagrams={diagrams}
          onToggleDiagram={handleToggleDiagram}
          markdown={readme}
          onChangeMarkdown={setReadme}
          onGenerate={() => void handleGenerate()}
          onCopy={() => void handleCopy()}
          onDownload={handleDownload}
          onExportDiagrams={() => void handleExportDiagrams()}
          copied={copied}
          generating={status === 'generating'}
          aiConfig={aiConfig}
          projectSummary={projectSummaryOf(analysis)}
          onOpenAiSettings={() => setAiSettingsOpen(true)}
          onOpenReadmeSettings={() => setSettingsOpen(true)}
          onRegenerateDiagrams={handleRegenerateDiagrams}
          onSuggest={setSuggestion}
          suggestion={suggestion}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onBack={() => setView('landing')}
        />
        <AssistantSettingsModal
          open={aiSettingsOpen}
          config={aiConfig}
          onSave={saveAiConfig}
          onClear={clearAiConfig}
          onClose={() => setAiSettingsOpen(false)}
        />
        <ReadmeSettingsModal
          open={settingsOpen}
          analysis={analysis}
          options={options}
          onChange={setOptions}
          onGenerate={() => void handleGenerate()}
          generating={status === 'generating'}
          disabled={files.length === 0}
          onClose={() => setSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-foreground flex flex-col">
      <a
        href="#upload"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-md focus:bg-app-accent focus:text-app-accent-foreground focus:text-sm focus:font-semibold"
      >
        Skip to upload
      </a>

      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="flex-1">
        <Hero />
        <HowItWorks />

        <div className="app-container py-16 sm:py-20 space-y-16 sm:space-y-20">
          {analysis && files.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setAuthOpen(true);
                  return;
                }
                setView('workspace');
              }}
              className="btn btn-primary w-full py-3 text-[15px]"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              Resume your README workspace
            </button>
          )}

          <ProjectUploader
            files={files}
            status={status}
            error={error}
            onFilesRead={handleFilesRead}
            onRemoveFile={handleRemoveFile}
            onClearFiles={handleClearFiles}
            onError={setError}
          />
        </div>

        <ExamplesSection onLoadSample={handleLoadSample} />
      </main>

      <Footer />

      <span className="sr-only" aria-live="polite">
        {totalUploadSize > 0 ? `${files.length} files, ${formatBytes(totalUploadSize)}` : ''}
      </span>

      <AssistantSettingsModal
        open={aiSettingsOpen}
        config={aiConfig}
        onSave={saveAiConfig}
        onClear={clearAiConfig}
        onClose={() => setAiSettingsOpen(false)}
      />
      <ReadmeSettingsModal
        open={settingsOpen}
        analysis={analysis}
        options={options}
        onChange={setOptions}
        onGenerate={() => void handleGenerate()}
        generating={status === 'generating'}
        disabled={files.length === 0}
        onClose={() => setSettingsOpen(false)}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
};

export default App;
