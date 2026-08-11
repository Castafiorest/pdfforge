import { useState } from 'react';

import { Dropzone } from '../components/Dropzone';
import { ClientResultPanel } from '../components/ClientResultPanel';
import { SpinnerIcon, TrashIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import { formatBytes } from '../lib/format';
import {
  imagesToPdf,
  isSupportedImage,
  type FitMode,
  type PageSizePreset,
} from '../lib/pdf';

export function ImageToPdfPage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSizePreset>('auto');
  const [fit, setFit] = useState<FitMode>('contain');
  const [margin, setMargin] = useState('0');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(isSupportedImage);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const convert = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await imagesToPdf(files, {
        pageSize,
        fit,
        margin: parseFloat(margin) || 0,
        orientation,
      });
      setResult({ bytes, name: `images-${Date.now()}.pdf` });
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.imageToPdf.title}</h1>
      <p className="mt-2 text-slate-400">{t.imageToPdf.subtitle}</p>

      {!result && (
        <>
          <div className="mt-8">
            <Dropzone multiple accept="image/*" onFiles={addFiles} hint={t.upload.imagesOnly} />
          </div>

          {files.length > 0 && (
            <ul className="mt-6 space-y-2">
              {files.map((file, index) => (
                <li
                  key={file.name}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{file.name}</span>
                  <span className="flex-none text-xs text-slate-500">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex-none rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <TrashIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label={t.imageToPdf.pageSize}>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSizePreset)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="auto">{t.imageToPdf.auto}</option>
                <option value="a4">{t.imageToPdf.a4}</option>
                <option value="letter">{t.imageToPdf.letter}</option>
              </select>
            </Field>
            <Field label={t.imageToPdf.orientation}>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'auto' | 'portrait' | 'landscape')}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="auto">{t.imageToPdf.auto}</option>
                <option value="portrait">{t.imageToPdf.portrait}</option>
                <option value="landscape">{t.imageToPdf.landscape}</option>
              </select>
            </Field>
            <Field label={t.imageToPdf.fit}>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as FitMode)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="contain">{t.imageToPdf.fitContain}</option>
                <option value="cover">{t.imageToPdf.fitCover}</option>
                <option value="stretch">{t.imageToPdf.fitStretch}</option>
              </select>
            </Field>
            <Field label={`${t.imageToPdf.margin} (mm)`}>
              <input
                type="number"
                min={0}
                step={1}
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          <button
            type="button"
            disabled={files.length === 0 || busy}
            onClick={convert}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <SpinnerIcon size={18} />}
            {t.hero.cta}
          </button>
        </>
      )}

      {result && (
        <div className="mt-8">
          <ClientResultPanel bytes={result.bytes} filename={result.name} />
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-3 w-full rounded-xl py-2 text-sm text-slate-500 transition hover:text-white"
          >
            ← {t.common.back}
          </button>
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
