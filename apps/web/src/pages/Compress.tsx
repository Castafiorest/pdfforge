import { useState } from 'react';

import { apiErrorMessage, createCompressBatch } from '../api/client';
import { Dropzone } from '../components/Dropzone';
import { JobResultCard } from '../components/JobResultCard';
import { SpinnerIcon, TrashIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import { formatBytes } from '../lib/format';
import type { BatchJobItem, CompressPreset } from '@pdfforge/shared';
import { COMPRESS_PRESETS } from '@pdfforge/shared';

const PRESET_META: Record<CompressPreset, { icon: string }> = {
  lossless: { icon: '🔍' },
  balanced: { icon: '⚖️' },
  maximum: { icon: '📦' },
};

export function CompressPage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<CompressPreset>('balanced');
  const [jobs, setJobs] = useState<BatchJobItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !names.has(f.name))];
    });
    setJobs(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setJobs(null);
  };

  const submit = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createCompressBatch(files, preset);
      setJobs(res.jobs);
      setFiles([]);
    } catch (e) {
      setError(apiErrorMessage(e, t.errors.generic));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.compress.title}</h1>
      <p className="mt-2 text-slate-400">{t.compress.subtitle}</p>

      {!jobs && (
        <>
          <div className="mt-8">
            <Dropzone multiple onFiles={addFiles} />
          </div>

          {files.length > 0 && (
            <>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>
                  {files.length} {t.compress.files}
                </span>
              </div>
              <ul className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={file.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                      {file.name}
                    </span>
                    <span className="flex-none text-xs text-slate-500">
                      {formatBytes(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="flex-none rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title={t.merge.remove}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
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
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={files.length === 0 || busy}
            onClick={submit}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <SpinnerIcon size={18} />}
            {files.length > 0
              ? `${t.hero.cta} (${files.length} ${t.compress.files})`
              : t.hero.cta}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">{t.compress.note}</p>
        </>
      )}

      {jobs && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t.compress.batchResults}</h2>
            <button
              type="button"
              onClick={() => setJobs(null)}
              className="text-sm text-slate-500 transition hover:text-white"
            >
              ← {t.common.back}
            </button>
          </div>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.job_id}>
                <p className="mb-1.5 truncate text-sm font-medium text-slate-300">
                  📄 {job.filename ?? job.job_id}
                </p>
                <JobResultCard jobId={job.job_id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

