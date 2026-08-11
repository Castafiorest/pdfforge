import { useState } from 'react';

import { apiErrorMessage, createJob } from '../api/client';
import { Dropzone } from '../components/Dropzone';
import { JobResultCard } from '../components/JobResultCard';
import { SpinnerIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';

export function PdfToImagePage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('png');
  const [dpi, setDpi] = useState('150');
  const [pages, setPages] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createJob('pdf-to-image', file, {
        image_format: format,
        dpi,
        pages,
      });
      setJobId(res.job_id);
    } catch (e) {
      setError(apiErrorMessage(e, t.errors.generic));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.pdfToImage.title}</h1>
      <p className="mt-2 text-slate-400">{t.pdfToImage.subtitle}</p>

      {!jobId && (
        <>
          <div className="mt-8">
            <Dropzone onFiles={(files) => setFile(files[0] ?? null)} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Field label={t.pdfToImage.format}>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
            </Field>
            <Field label={t.pdfToImage.dpi}>
              <input
                type="number"
                min={50}
                max={400}
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </Field>
            <Field label={t.pdfToImage.pages}>
              <input
                type="text"
                value={pages}
                placeholder="1-5, 8"
                onChange={(e) => setPages(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />
              <span className="mt-1 block text-xs text-slate-500">{t.pdfToImage.pagesHint}</span>
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
