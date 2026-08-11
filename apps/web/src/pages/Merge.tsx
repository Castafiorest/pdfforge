import { useState } from 'react';

import { Dropzone } from '../components/Dropzone';
import { ClientResultPanel } from '../components/ClientResultPanel';
import { SpinnerIcon, TrashIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import { formatBytes } from '../lib/format';
import { mergePdfs } from '../lib/pdf';

export function MergePage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !names.has(f.name))];
    });
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const move = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setResult(null);
  };

  const merge = async () => {
    if (files.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await mergePdfs(files);
      setResult({
        bytes,
        name: `merged-${Date.now()}.pdf`,
      });
    } catch {
      setError(t.errors.invalidPdf);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.merge.title}</h1>
      <p className="mt-2 text-slate-400">{t.merge.subtitle}</p>

      <div className="mt-8">
        <Dropzone multiple onFiles={addFiles} hint={t.merge.addMore} />
      </div>

      {files.length > 0 && (
        <ul className="mt-6 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null && dragIndex !== index) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <span className="cursor-grab text-slate-500" title={t.merge.order}>
                ⠿
              </span>
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{file.name}</span>
              <span className="flex-none text-xs text-slate-500">{formatBytes(file.size)}</span>
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
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <button
        type="button"
        disabled={files.length < 2 || busy}
        onClick={merge}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy && <SpinnerIcon size={18} />}
        {t.hero.cta}
      </button>

      {result && (
        <div className="mt-8">
          <ClientResultPanel bytes={result.bytes} filename={result.name} />
        </div>
      )}
    </ToolShell>
  );
}
