import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

import { Dropzone } from '../components/Dropzone';
import { ClientResultPanel } from '../components/ClientResultPanel';
import { SpinnerIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import { splitPdf, type SplitMode } from '../lib/pdf';

export function SplitPage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('1');
  const [every, setEvery] = useState('2');
  const [results, setResults] = useState<{ bytes: Uint8Array; name: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadedPages(null);
    if (!file) return;
    file
      .arrayBuffer()
      .then((buf) => PDFDocument.load(buf, { ignoreEncryption: true }))
      .then((doc) => {
        if (!cancelled) setLoadedPages(doc.getPageCount());
      })
      .catch(() => {
        if (!cancelled) setLoadedPages(null);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const doSplit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const parts = await splitPdf(file, mode, ranges, parseInt(every, 10) || 2);
      setResults(parts);
    } catch {
      setError(t.errors.noPages);
    } finally {
      setBusy(false);
    }
  };

  const allBytes = results
    ? new Blob(
        results.map((r) => r.bytes.slice().buffer as ArrayBuffer),
        { type: 'application/pdf' },
      )
    : null;

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.split.title}</h1>
      <p className="mt-2 text-slate-400">{t.split.subtitle}</p>

      {!results && (
        <>
          <div className="mt-8">
            <Dropzone onFiles={(files) => { setFile(files[0] ?? null); setResults(null); }} />
          </div>

          {file && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              📄 {file.name} · {loadedPages ?? '…'} {t.organize.pages}
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {(
              [
                ['ranges', t.split.modeRanges],
                ['every', t.split.modeEvery],
                ['all', t.split.modeAll],
              ] as [SplitMode, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-2xl border p-4 text-sm font-medium transition ${
                  mode === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'ranges' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300">
                {t.split.ranges}
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="1-5, 8, 10-12"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />
              <span className="mt-1 block text-xs text-slate-500">{t.split.rangesHint}</span>
            </div>
          )}

          {mode === 'every' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300">{t.split.every}</label>
              <input
                type="number"
                min={1}
                value={every}
                onChange={(e) => setEvery(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          <button
            type="button"
            disabled={!file || busy}
            onClick={doSplit}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <SpinnerIcon size={18} />}
            {t.hero.cta}
          </button>
        </>
      )}

      {results && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-slate-400">
            {results.length} {t.split.parts}
          </p>
          {results.map((r) => (
            <ClientResultPanel key={r.name} bytes={r.bytes} filename={r.name} />
          ))}
          {allBytes && (
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(allBytes);
                a.download = `${file?.name.replace(/\.pdf$/i, '')}-parts.zip`;
                a.click();
              }}
              className="mt-2 w-full rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              ⬇ {t.job.downloadZip}
            </button>
          )}
          <button
            type="button"
            onClick={() => setResults(null)}
            className="w-full rounded-xl py-2 text-sm text-slate-500 transition hover:text-white"
          >
            ← {t.common.back}
          </button>
        </div>
      )}
    </ToolShell>
  );
}
