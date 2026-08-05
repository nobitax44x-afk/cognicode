import React from 'react';
import { Github, Mail, MapPin } from 'lucide-react';
import { Logo } from './Logo';

const PRODUCT_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Examples', href: '#examples' },
];

const NIGHTMARE_URL = 'https://github.com/BornilMahmud';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-app-border bg-app-bg-subtle/60">
      <div className="app-container py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="sm:col-span-2 lg:col-span-2 max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-app-muted">
              Upload a codebase and get a stunning README.md, visual architecture diagrams, and an
              AI assistant to refine it. Fully client-side — your code and keys never leave your
              browser.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-app-faint">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-app-muted hover:text-app-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-app-faint">Resources</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={NIGHTMARE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-app-muted hover:text-app-foreground transition-colors"
                >
                  <Github className="w-4 h-4" aria-hidden="true" />
                  GitHub
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-app-muted hover:text-app-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#examples" className="text-sm text-app-muted hover:text-app-foreground transition-colors">
                  Sample READMEs
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Contact">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-app-faint">Contact</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="mailto:bornilprof@gmail.com"
                  className="inline-flex items-center gap-1.5 text-sm text-app-muted hover:text-app-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  bornilprof@gmail.com
                </a>
              </li>
              <li className="inline-flex items-center gap-1.5 text-sm text-app-muted">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                Daffodil Smart City
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-app-border pt-6 text-xs text-app-faint">
          <p>© {currentYear} CogniCode. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built by{' '}
            <a
              href={NIGHTMARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-app-foreground underline decoration-app-border-strong underline-offset-4 hover:text-app-accent hover:decoration-app-accent transition-colors"
            >
              Nightmare
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
