import React from 'react';
import { FileText } from 'lucide-react';

interface CogniCodeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'stacked';
  showSubtitle?: boolean;
}

export const CogniCodeLogo: React.FC<CogniCodeLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = false,
}) => {
  const box = size === 'lg' ? 'w-12 h-12 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const icon = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const title = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <span className={`${box} bg-app-accent text-app-accent-foreground flex items-center justify-center shrink-0`}>
        <FileText className={icon} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${title} font-bold text-app-foreground tracking-tight`}>CogniCode</span>
        {showSubtitle && (
          <span className="text-[10px] text-app-faint font-mono mt-1">AI Documentation Platform</span>
        )}
      </span>
    </div>
  );
};
