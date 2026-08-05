import type { Theme } from '../hooks/useTheme';
import { renderMermaidCached } from './mermaidRenderer';

export function mermaidThemeVariables(theme: Theme) {
  return {
    primaryColor: theme === 'dark' ? '#24242e' : '#eef0ff',
    primaryTextColor: theme === 'dark' ? '#ededf0' : '#1f2233',
    primaryBorderColor: theme === 'dark' ? '#3d3d49' : '#c7cdf3',
    lineColor: theme === 'dark' ? '#8b94e8' : '#5e6ad2',
    secondaryColor: theme === 'dark' ? '#1d1d25' : '#f4f4f6',
    tertiaryColor: theme === 'dark' ? '#0b0b10' : '#ffffff',
    background: theme === 'dark' ? '#0b0b10' : '#ffffff',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    clusterBkg: theme === 'dark' ? '#131318' : '#f7f7f8',
    clusterBorder: theme === 'dark' ? '#2a2a33' : '#e4e4e7',
    edgeLabelBackground: theme === 'dark' ? '#131318' : '#ffffff',
  };
}

export async function renderMermaid(source: string, theme: Theme): Promise<string> {
  return renderMermaidCached(source, theme);
}
