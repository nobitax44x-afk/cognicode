import React from 'react';

interface LogoProps {
  compact?: boolean;
  className?: string;
}

export function LogoMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" className="fill-app-accent" />
      <path
        d="M11 10.5c0-1.4 1.1-2.5 2.5-2.5h5c1.4 0 2.5 1.1 2.5 2.5v3c0 1.4-1.1 2.5-2.5 2.5h-5a2.5 2.5 0 0 0-2.5 2.5v3c0 1.4 1.1 2.5 2.5 2.5h5c1.4 0 2.5-1.1 2.5-2.5v-3c0-1.4-1.1-2.5-2.5-2.5"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 10.5v11" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export const Logo: React.FC<LogoProps> = ({ compact = false, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span className="drop-shadow-sm">
        <LogoMark />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-app-foreground">
            Cogni<span className="text-app-accent">Code</span>
          </span>
          <span className="text-[10px] font-mono text-app-faint mt-0.5">
            README studio
          </span>
        </span>
      )}
    </span>
  );
};
