import { Link } from 'react-router-dom';

import { ToolCard } from '../components/ToolCard';
import {
  CompressIcon,
  EraserIcon,
  GithubIcon,
  ImageIcon,
  MergeIcon,
  OrganizeIcon,
  PhotoIcon,
  ShieldIcon,
  SplitIcon,
} from '../components/icons';
import { useI18n } from '../i18n';

export function Landing() {
  const { t } = useI18n();

  const tools = [
    { to: '/tools/compress', icon: CompressIcon, name: t.tools.compress.name, description: t.tools.compress.desc, badge: 'Server' },
    { to: '/tools/merge', icon: MergeIcon, name: t.tools.merge.name, description: t.tools.merge.desc, badge: 'Browser' },
    { to: '/tools/split', icon: SplitIcon, name: t.tools.split.name, description: t.tools.split.desc, badge: 'Browser' },
    { to: '/tools/organize', icon: OrganizeIcon, name: t.tools.organize.name, description: t.tools.organize.desc, badge: 'Browser' },
    { to: '/tools/image-to-pdf', icon: ImageIcon, name: t.tools.imageToPdf.name, description: t.tools.imageToPdf.desc, badge: 'Browser' },
    { to: '/tools/pdf-to-image', icon: PhotoIcon, name: t.tools.pdfToImage.name, description: t.tools.pdfToImage.desc, badge: 'Server' },
    { to: '/tools/remove-metadata', icon: EraserIcon, name: t.tools.removeMetadata.name, description: t.tools.removeMetadata.desc, badge: 'Server' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 text-center md:pt-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.hero.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/tools/compress"
              className="rounded-xl bg-indigo-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-400"
            >
              {t.hero.cta}
            </Link>
            <a
              href="#selfhost"
              className="rounded-xl border border-slate-700 px-7 py-3.5 font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <HeroStat value="🖥️" label={t.hero.statFiles} />
            <HeroStat value="⏱️" label={t.hero.statDelete} />
            <HeroStat value="🔓" label={t.hero.statOpen} />
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{t.sections.tools}</h2>
          <p className="mt-3 text-slate-400">{t.sections.toolsSub}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.to} {...tool} />
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 border-y border-white/5 bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldIcon size={24} />
            </span>
            <h2 className="mt-5 text-3xl font-bold text-white md:text-4xl">{t.sections.privacy}</h2>
            <p className="mt-3 text-slate-400">{t.sections.privacySub}</p>
            <ul className="mt-8 space-y-4">
              {[
                t.privacy.temporary,
                t.privacy.autoDelete,
                t.privacy.noAds,
                t.privacy.noTraining,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 font-mono text-sm">
            <pre className="text-slate-300">
{`# Files are ephemeral
/tmp/pdfforge/jobs/{uuid}/

input.pdf   ← uploaded
output.pdf  ← result

# Deleted automatically
TTL = 30 minutes

# Never stored:
#  - database rows with content
#  - analytics on your documents
#  - AI training data`}
            </pre>
          </div>
        </div>
      </section>

      {/* Self-host */}
      <section id="selfhost" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 font-mono text-sm">
            <div className="mb-4 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            </div>
            <pre className="text-slate-300">
{`$ git clone https://github.com/USERNAME/pdfforge
$ cd pdfforge
$ cp .env.example .env
$ docker compose up -d

→ http://localhost:3000`}
            </pre>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">{t.sections.selfHost}</h2>
            <p className="mt-3 text-slate-400">{t.sections.selfHostSub}</p>
            <p className="mt-5 text-slate-300">{t.selfHost.docker}</p>
            <p className="mt-2 text-slate-400">{t.selfHost.control}</p>
            <a
              href="#github"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              <GithubIcon size={18} />
              {t.nav.github}
            </a>
          </div>
        </div>
      </section>

      {/* GitHub CTA */}
      <section id="github" className="scroll-mt-20 border-t border-white/5 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{t.sections.github}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{t.sections.githubSub}</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            <GithubIcon size={20} />
            {t.nav.github}
          </a>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
      <div className="text-2xl">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{label}</div>
    </div>
  );
}
