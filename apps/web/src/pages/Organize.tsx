import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

import { Dropzone } from '../components/Dropzone';
import { ClientResultPanel } from '../components/ClientResultPanel';
import { PageThumb } from '../components/PageThumb';
import { CopyIcon, RotateIcon, SpinnerIcon, TrashIcon } from '../components/icons';
import { ToolShell } from '../components/Layout';
import { useI18n } from '../i18n';
import { organizePdf, type PageItem, type Rotation } from '../lib/pdf';

let keyCounter = 0;
const nextKey = () => `p-${keyCounter++}`;

export function OrganizePage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<PageItem[]>([]);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!file) return;
    file
      .arrayBuffer()
      .then((buf) => PDFDocument.load(buf, { ignoreEncryption: true }))
      .then((doc) => {
        if (cancelled) return;
        setItems(
          Array.from({ length: doc.getPageCount() }, (_, i) => ({
            key: nextKey(),
            sourceIndex: i,
            rotation: 0 as Rotation,
          })),
        );
      })
      .catch(() => setError(t.errors.invalidPdf));
    return () => {
      cancelled = true;
    };
  }, [file, t]);

  const rotate = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, rotation: (((item.rotation + delta) % 360) + 360) % 360 as Rotation }
          : item,
      ),
    );
  };

  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicate = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...next[index], key: nextKey() });
      return next;
    });
  };

  const move = (from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const create = async () => {
    if (!file || items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await organizePdf(file, items);
      setResult({ bytes, name: `organized-${Date.now()}.pdf` });
    } catch {
      setError(t.errors.invalidPdf);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell>
      <h1 className="text-3xl font-bold text-white">{t.organize.title}</h1>
      <p className="mt-2 text-slate-400">{t.organize.subtitle}</p>

      {!file && (
        <div className="mt-8">
          <Dropzone onFiles={(files) => setFile(files[0] ?? null)} />
        </div>
      )}

      {file && !result && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              📄 {file.name} · {items.length} {t.organize.pages}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-sm text-slate-500 transition hover:text-white"
            >
              {t.common.cancel}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, index) => (
              <div
                key={item.key}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex != null && dragIndex !== index) move(dragIndex, index);
                  setDragIndex(null);
                }}
                className={`group rounded-xl border border-slate-800 bg-slate-900/60 p-2 transition ${
                  dragIndex === index ? 'opacity-40' : ''
                }`}
              >
                <div className="mb-2 text-center text-xs font-semibold text-slate-500">
                  {index + 1}
                </div>
                <PageThumb file={file} pageNumber={item.sourceIndex + 1} rotation={item.rotation} />
                <div className="mt-2 flex items-center justify-center gap-1">
                  <IconButton title={t.organize.rotateLeft} onClick={() => rotate(index, -90)}>
                    <RotateIcon size={14} className="-scale-x-100" />
                  </IconButton>
                  <IconButton title={t.organize.rotateRight} onClick={() => rotate(index, 90)}>
                    <RotateIcon size={14} />
                  </IconButton>
                  <IconButton title={t.organize.duplicate} onClick={() => duplicate(index)}>
                    <CopyIcon size={14} />
                  </IconButton>
                  <IconButton title={t.organize.deletePage} danger onClick={() => remove(index)}>
                    <TrashIcon size={14} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          <button
            type="button"
            disabled={items.length === 0 || busy}
            onClick={create}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <SpinnerIcon size={18} />}
            {t.organize.saveOrder}
          </button>
        </>
      )}

      {result && (
        <div className="mt-8">
          <ClientResultPanel bytes={result.bytes} filename={result.name} />
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
            className="mt-3 w-full rounded-xl py-2 text-sm text-slate-500 transition hover:text-white"
          >
            ← {t.common.back}
          </button>
        </div>
      )}
    </ToolShell>
  );
}

function IconButton({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${
        danger
          ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
