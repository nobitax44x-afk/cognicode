import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Shield, 
  Bell, 
  Database, 
  Sparkles, 
  Check, 
  Trash2,
  Lock
} from 'lucide-react';

interface SettingsPageProps {
  onOpenLogin: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenLogin }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [autoSave, setAutoSave] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [diagramTheme, setDiagramTheme] = useState<'dark' | 'forest' | 'ocean'>('dark');

  const handleSaveSettings = () => {
    toast.success('Settings Saved', 'Your application preferences have been updated.');
  };

  return (
    <ProtectedRoute onOpenLogin={onOpenLogin} fallbackTitle="Settings Access Restricted">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-sky-400" />
              Account & Platform Settings
            </h2>
            <p className="text-xs text-slate-400">
              Customize your documentation generation defaults, themes, and notification preferences.
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
          
          {/* General Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Documentation Preferences
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">Auto-save Markdown Changes</span>
                  <p className="text-[11px] text-slate-400">Automatically cache edits locally as you type in the Markdown Editor.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer accent-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">Email Analysis Reports</span>
                  <p className="text-[11px] text-slate-400">Receive summary emails when architecture analysis finishes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer accent-sky-500"
                />
              </label>
            </div>
          </div>

          {/* Diagram Theme Option */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Moon className="w-4 h-4 text-purple-400" />
              Mermaid Diagram Styling Theme
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Dark Slate', desc: 'High contrast dark syntax' },
                { id: 'forest', label: 'Emerald Forest', desc: 'Cyber green accent lines' },
                { id: 'ocean', label: 'Deep Ocean', desc: 'Royal blue & cyan hues' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setDiagramTheme(theme.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    diagramTheme === theme.id
                      ? 'bg-sky-500/10 border-sky-500 text-slate-100 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{theme.label}</span>
                    {diagramTheme === theme.id && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{theme.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              Save Preferences
            </button>
          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
};
export default SettingsPage;
