import { useState } from 'react';

import { createJob } from '../api/client';
import { Dropzone } from '../components/Dropzone';
import { JobResultCard } from '../components/JobResultCard';
import { SpinnerIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';

export function RemoveMetadataPage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createJob('remove-metadata', file);
      setJobId(res.job_id);
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.removeMetadata.title}</h1>
      <p className="mt-2 text-slate-400">{t.removeMetadata.subtitle}</p>

      {!jobId && (
        <>
          <div className="mt-8">
            <Dropzone onFiles={(files) => setFile(files[0] ?? null)} />
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
