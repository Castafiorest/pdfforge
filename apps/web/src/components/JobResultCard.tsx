import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteJob, downloadUrl, getJob } from '../api/client';
import { useI18n } from '../i18n';
import { formatBytes, formatPercent } from '../lib/format';
import { CheckIcon, DownloadIcon, SpinnerIcon, TrashIcon, XIcon } from './icons';

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-slate-500/15 text-slate-300 border-slate-600/50',
  processing: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  failed: 'bg-red-500/15 text-red-300 border-red-500/40',
  expired: 'bg-slate-500/15 text-slate-400 border-slate-600/50',
  deleted: 'bg-slate-500/15 text-slate-400 border-slate-600/50',
};

export function JobResultCard({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [deleted, setDeleted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'completed' || query.state.data?.status === 'failed'
        ? false
        : 1500,
    // Keep polling even when the tab is in the background (batch jobs take a while).
    refetchIntervalInBackground: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-slate-300">
        <SpinnerIcon size={20} />
        {t.common.processing}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-10 text-center">
        <XIcon size={28} className="text-red-400" />
        <p className="text-slate-200">{t.errors.processingFailed}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
        >
          {t.job.tryAgain}
        </button>
      </div>
    );
  }

  const statusLabel =
    t.job[data.status as keyof typeof t.job] ?? data.status;

  const handleDelete = async () => {
    await deleteJob(jobId);
    setDeleted(true);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLES[data.status] ?? ''}`}>
          {statusLabel}
        </span>
        {data.status === 'processing' && (
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <SpinnerIcon size={16} />
            {data.progress}%
          </div>
        )}
      </div>

      {data.status === 'completed' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label={t.job.original} value={formatBytes(data.original_size)} />
            <Stat label={t.job.result} value={formatBytes(data.output_size)} />
            {data.tool === 'compress' ? (
              <Stat
                label={t.job.reduction}
                value={formatPercent(data.reduction_percent)}
                highlight={data.reduction_percent != null && data.reduction_percent > 0}
              />
            ) : (
              <Stat label={t.job.result} value={data.output_size != null ? '✓' : '—'} />
            )}
          </div>

          {data.tool === 'compress' &&
            data.reduction_percent != null &&
            data.reduction_percent <= 0 && (
              <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                {t.compress.noGain}
              </p>
            )}

          <div className="flex flex-wrap gap-3">
            <a
              href={downloadUrl(jobId)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
            >
              <DownloadIcon size={18} />
              {data.tool === 'pdf-to-image' ? t.job.downloadZip : t.common.download}
            </a>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
            >
              <TrashIcon size={16} />
              {t.common.delete}
            </button>
          </div>
          <p className="text-center text-xs text-slate-500">{t.job.autoDeleteNote}</p>
        </div>
      )}

      {data.status === 'failed' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <XIcon size={28} className="text-red-400" />
          <p className="text-slate-200">{t.errors.processingFailed}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            {t.job.tryAgain}
          </button>
        </div>
      )}

      {(data.status === 'queued' || data.status === 'processing') && (
        <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
          <SpinnerIcon size={24} />
          <p className="text-sm">{t.common.processing}</p>
        </div>
      )}

      {deleted && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckIcon size={18} />
          {t.job.deletedNow}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-4">
      <div className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
