import React, { useEffect, useState } from 'react';
import { Github, LogOut, Menu, Moon, Sun, User as UserIcon, X } from 'lucide-react';
import { Logo } from './Logo';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Examples', href: '#examples' },
];

function initialsOf(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || 'U';
  const parts = source.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMenuOpen(false);
    void logout();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-200 ${
        scrolled
          ? 'border-app-border bg-app-bg/85 backdrop-blur-md shadow-app-xs'
          : 'border-transparent bg-app-bg'
      }`}
    >
      <div className="app-container h-16 flex items-center justify-between gap-4">
        <a
          href="#home"
          className="inline-flex items-center rounded-md"
          aria-label="README Generator — home"
        >
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-md text-sm font-medium text-app-muted hover:text-app-foreground hover:bg-app-surface-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/BornilMahmud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-app-muted hover:text-app-foreground hover:bg-app-surface-muted transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-ghost btn p-2.5 rounded-md"
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="w-[18px] h-[18px]" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:ring-2 hover:ring-sky-400/40 transition-all"
              >
                {initialsOf(user.displayName, user.email)}
              </button>
              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close user menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-11 z-20 w-60 overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-app-xl"
                  >
                    <div className="border-b border-app-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-app-foreground">
                        {user.displayName || 'CogniCode user'}
                      </p>
                      <p className="truncate text-xs text-app-faint">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-app-muted hover:bg-app-surface-muted hover:text-app-foreground transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex btn btn-ghost px-3 py-1.5 text-sm"
              >
                <UserIcon className="w-4 h-4" aria-hidden="true" />
                Login
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex btn btn-primary px-3 py-1.5 text-sm"
              >
                Register
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-ghost btn p-2.5 rounded-md md:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="md:hidden border-t border-app-border bg-app-bg shadow-app-md"
        >
          <div className="app-container py-3 flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium text-app-muted hover:text-app-foreground hover:bg-app-surface-muted transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/BornilMahmud"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium text-app-muted hover:text-app-foreground hover:bg-app-surface-muted transition-colors"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              GitHub
            </a>

            <div className="mt-2 border-t border-app-border pt-3">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3">
                    <p className="truncate text-sm font-semibold text-app-foreground">
                      {user.displayName || 'CogniCode user'}
                    </p>
                    <p className="truncate text-xs text-app-faint">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-app-muted hover:bg-app-surface-muted hover:text-app-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="btn btn-ghost px-3 py-2 text-sm"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="btn btn-primary px-3 py-2 text-sm"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
