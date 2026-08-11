import { useState } from 'react';

import { createJob } from '../api/client';
import { Dropzone } from '../components/Dropzone';
import { JobResultCard } from '../components/JobResultCard';
import { SpinnerIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import type { CompressPreset } from '@pdfforge/shared';
import { COMPRESS_PRESETS } from '@pdfforge/shared';

const PRESET_META: Record<CompressPreset, { icon: string }> = {
  lossless: { icon: '🔍' },
  balanced: { icon: '⚖️' },
  maximum: { icon: '📦' },
};

export function CompressPage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<CompressPreset>('balanced');
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createJob('compress', file, { preset });
      setJobId(res.job_id);
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.compress.title}</h1>
      <p className="mt-2 text-slate-400">{t.compress.subtitle}</p>

      {!jobId && (
        <>
          <div className="mt-8">
            <Dropzone onFiles={(files) => setFile(files[0] ?? null)} />
          </div>

          {file && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              📄 {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t.compress.preset}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {COMPRESS_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    preset === p
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xl">{PRESET_META[p].icon}</div>
                  <div className="mt-2 font-semibold text-white">
                    {t.compress[p as keyof typeof t.compress]}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {t.compress[`${p}Desc` as keyof typeof t.compress]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          <button
            type="button"
            disabled={!file || busy}
            onClick={submit}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <SpinnerIcon size={18} />}
            {t.hero.cta}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">{t.compress.note}</p>
        </>
      )}

      {jobId && (
        <div className="mt-8">
          <JobResultCard jobId={jobId} />
        </div>
      )}
    </ToolShell>
  );
}
