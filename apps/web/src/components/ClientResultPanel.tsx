import { triggerDownload } from '../lib/format';
import { DownloadIcon } from './icons';

type ClientResultPanelProps = {
  bytes: Uint8Array;
  filename: string;
  note?: string;
  mimeType?: string;
};

export function ClientResultPanel({
  bytes,
  filename,
  note,
  mimeType = 'application/pdf',
}: ClientResultPanelProps) {
  const size = bytes.byteLength;
  const handleDownload = () => {
    triggerDownload(
      new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType }),
      filename,
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
          ✓ {filename}
        </span>
        <span className="text-sm text-slate-400">
          {size < 1024 * 1024
            ? `${(size / 1024).toFixed(1)} KB`
            : `${(size / (1024 * 1024)).toFixed(2)} MB`}
        </span>
      </div>
      {note && <p className="mb-4 text-sm text-slate-400">{note}</p>}
      <button
        type="button"
        onClick={handleDownload}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
      >
        <DownloadIcon size={18} />
        {filename}
      </button>
    </div>
  );
}
