import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useI18n } from '../i18n';
import { GithubIcon, GlobeIcon, LogoIcon } from './icons';

function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
      title={locale === 'en' ? 'Bahasa Indonesia' : 'English'}
    >
      <GlobeIcon size={16} />
      <span className="font-medium">{locale === 'en' ? 'EN' : 'ID'}</span>
    </button>
  );
}

export function Layout() {
  const { t } = useI18n();
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <LogoIcon size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              PDF<span className="text-indigo-400">Forge</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/#tools" className={navLinkClass}>
              {t.nav.tools}
            </NavLink>
            <NavLink to="/#privacy" className={navLinkClass}>
              {t.nav.privacy}
            </NavLink>
            <NavLink to="/#selfhost" className={navLinkClass}>
              {t.nav.selfHost}
            </NavLink>
            <a
              href="https://github.com"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon size={16} />
              {t.nav.github}
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            <Link
              to="/tools/compress"
              className="ml-2 hidden rounded-lg bg-indigo-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 sm:block"
            >
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <div className="flex items-center gap-2 text-slate-400">
            <LogoIcon size={18} />
            <span className="text-sm">
              PDFForge — {t.footer.madeWith}
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm text-slate-400">
            <Link to="/" className="transition hover:text-white">
              {t.footer.links}
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
              {t.nav.github}
            </a>
            <span className="text-slate-500">{t.footer.license}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ToolShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <span aria-hidden>←</span> {t.common.back}
      </Link>
      {children}
    </div>
  );
}
