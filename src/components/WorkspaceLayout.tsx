import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Wand2,
  Loader2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Images,
  X,
} from 'lucide-react';
import type { AIConfig, DiagramDef, PipelineStep, ProjectAnalysis, ReadmeOptions } from '../types';
import { ProgressFlow } from './ProgressFlow';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AssistantPanel } from './AssistantPanel';
import { DiffView } from './DiffView';

interface WorkspaceLayoutProps {
  projectName: string;
  pipeline: PipelineStep;
  analysis: ProjectAnalysis | null;
  options: ReadmeOptions;
  onChangeOptions: (options: ReadmeOptions) => void;
  diagrams: DiagramDef[];
  onToggleDiagram: (id: string) => void;
  markdown: string;
  onChangeMarkdown: (value: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onExportDiagrams: () => void;
  copied: boolean;
  generating: boolean;
  aiConfig: AIConfig | null;
  projectSummary: string;
  onOpenAiSettings: () => void;
  onOpenReadmeSettings: () => void;
  onRegenerateDiagrams: () => void;
  onSuggest: (markdown: string) => void;
  suggestion: string | null;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
  onBack: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  projectName,
  pipeline,
  analysis,
  options,
  onChangeOptions,
  diagrams,
  onToggleDiagram,
  markdown,
  onChangeMarkdown,
  onGenerate,
  onCopy,
  onDownload,
  onExportDiagrams,
  copied,
  generating,
  aiConfig,
  projectSummary,
  onOpenAiSettings,
  onOpenReadmeSettings,
  onRegenerateDiagrams,
  onSuggest,
  suggestion,
  onAcceptSuggestion,
  onRejectSuggestion,
  onBack,
}) => {
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('preview');
  const [configOpen, setConfigOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const editorId = 'workspace-editor-textarea';

  const focusEditor = () => {
    setEditorTab('edit');
    setTimeout(() => document.getElementById(editorId)?.focus(), 0);
  };

  return (
    <div className="flex h-screen flex-col bg-app-bg">
      <header className="z-40 border-b border-app-border bg-app-bg/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-4">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-ghost p-2 rounded-md"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-app-foreground">{projectName}</h1>
            <p className="truncate text-[11px] text-app-faint">
              {analysis ? `${analysis.fileCount} files · ${analysis.totalLines.toLocaleString()} lines` : 'Workspace'}
            </p>
          </div>

          <div className="hidden xl:block w-64">
            <ProgressFlow current={pipeline} />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setConfigOpen((v) => !v)}
              aria-expanded={configOpen}
              aria-controls="workspace-config-drawer"
              title="Toggle config panel"
              className={`btn px-2.5 py-1.5 text-xs ${configOpen ? 'btn-primary' : 'btn-secondary'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Config</span>
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-app-success" aria-hidden="true" />
                  <span className="hidden md:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="btn btn-secondary px-2.5 py-1.5 text-xs"
              aria-label="Download README"
              title="Download README"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onExportDiagrams}
              className="btn btn-secondary px-2.5 py-1.5 text-xs"
              aria-label="Export diagrams as SVG and PNG"
              title="Export diagrams as SVG and PNG"
            >
              <Images className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={onOpenReadmeSettings}
              className="btn btn-secondary px-2.5 py-1.5 text-xs"
              aria-label="Open README settings"
              title="README settings"
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span className="hidden sm:inline">Generating…</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="xl:hidden px-4 pb-3">
          <ProgressFlow current={pipeline} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          id="workspace-config-drawer"
          aria-label="Workspace options"
          className={`hidden lg:block h-full shrink-0 overflow-hidden border-r border-app-border transition-[width] duration-200 ease-in-out ${
            configOpen ? 'w-[17rem]' : 'w-0 border-r-0'
          }`}
        >
          <div className="h-full w-[17rem] overflow-y-auto bg-app-bg-subtle/40">
            <WorkspaceSidebar
              analysis={analysis}
              options={options}
              onChangeOptions={onChangeOptions}
              diagrams={diagrams}
              onToggleDiagram={onToggleDiagram}
              onOpenSettings={onOpenReadmeSettings}
            />
          </div>
        </aside>

        <AnimatePresence>
          {configOpen && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setConfigOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                aria-label="Workspace options"
                className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-app-border bg-app-bg shadow-app-xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-app-border px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-app-foreground">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
                    Config
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfigOpen(false)}
                    className="btn btn-ghost p-1.5 rounded-md"
                    aria-label="Close config panel"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <WorkspaceSidebar
                    analysis={analysis}
                    options={options}
                    onChangeOptions={onChangeOptions}
                    diagrams={diagrams}
                    onToggleDiagram={onToggleDiagram}
                    onOpenSettings={onOpenReadmeSettings}
                  />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-hidden" aria-label="Editor and preview">
          <div className="flex h-full w-full flex-col">
            {suggestion && (
              <div className="relative z-10 border-b border-app-border p-3">
                <button
                  type="button"
                  onClick={onRejectSuggestion}
                  className="absolute right-2 top-2 z-10 btn btn-ghost p-1 rounded-md"
                  aria-label="Dismiss suggestion"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <DiffView
                  original={markdown}
                  suggested={suggestion}
                  onAccept={onAcceptSuggestion}
                  onReject={onRejectSuggestion}
                />
              </div>
            )}

            <div className="md:hidden border-b border-app-border bg-app-bg-subtle/60 px-2 py-1.5 flex gap-1" role="tablist" aria-label="Editor views">
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'preview'}
                onClick={() => setEditorTab('preview')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  editorTab === 'preview' ? 'bg-app-surface text-app-foreground shadow-app-xs' : 'text-app-muted'
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'edit'}
                onClick={focusEditor}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  editorTab === 'edit' ? 'bg-app-surface text-app-foreground shadow-app-xs' : 'text-app-muted'
                }`}
              >
                Edit Markdown
              </button>
            </div>

            <div className="grid flex-1 md:grid-cols-2 md:divide-x divide-app-border overflow-hidden">
              <div className={`overflow-hidden ${editorTab === 'edit' ? 'block' : 'hidden'} md:block`}>
                <MarkdownEditor value={markdown} onChange={onChangeMarkdown} textareaId={editorId} />
              </div>
              <div className={`overflow-hidden ${editorTab === 'preview' ? 'block' : 'hidden'} md:block`}>
                <MarkdownRenderer markdown={markdown} />
              </div>
            </div>
          </div>
        </main>

        <aside
          id="workspace-assistant-drawer"
          aria-label="AI assistant"
          className={`hidden lg:block h-full shrink-0 overflow-hidden border-l border-app-border transition-[width] duration-200 ease-in-out ${
            assistantOpen ? 'w-[21rem]' : 'w-0 border-l-0'
          }`}
        >
          <div className="h-full w-[21rem] bg-app-bg-subtle/40">
            <AssistantPanel
              config={aiConfig}
              onOpenSettings={onOpenAiSettings}
              readme={markdown}
              projectSummary={projectSummary}
              onSuggest={onSuggest}
              onRegenerateDiagrams={onRegenerateDiagrams}
            />
          </div>
        </aside>

        <AnimatePresence>
          {assistantOpen && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setAssistantOpen(false)}
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                aria-label="AI assistant"
                className="absolute inset-y-0 right-0 flex w-80 max-w-[90vw] flex-col border-l border-app-border bg-app-bg shadow-app-xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-app-border px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-app-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
                    AI Assistant
                  </span>
                  <button
                    type="button"
                    onClick={() => setAssistantOpen(false)}
                    className="btn btn-ghost p-1.5 rounded-md"
                    aria-label="Close AI assistant"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <AssistantPanel
                    config={aiConfig}
                    onOpenSettings={onOpenAiSettings}
                    readme={markdown}
                    projectSummary={projectSummary}
                    onSuggest={onSuggest}
                    onRegenerateDiagrams={onRegenerateDiagrams}
                  />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => setAssistantOpen((v) => !v)}
        aria-expanded={assistantOpen}
        aria-controls="workspace-assistant-drawer"
        title={assistantOpen ? 'Close AI assistant' : 'Open AI assistant'}
        className={`fixed bottom-5 z-40 btn btn-primary rounded-full p-3 shadow-app-xl transition-[right] duration-200 ${
          assistantOpen ? 'right-[21.75rem]' : 'right-5'
        }`}
      >
        {assistantOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Sparkles className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default WorkspaceLayout;
