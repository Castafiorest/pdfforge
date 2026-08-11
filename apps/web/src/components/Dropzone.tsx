import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react';

import { useI18n } from '../i18n';
import { UploadIcon } from './icons';

type DropzoneProps = {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  hint?: ReactNode;
  onFiles: (files: File[]) => void;
};

export function Dropzone({
  accept = '.pdf,application/pdf',
  multiple = false,
  maxSizeMb = 100,
  hint,
  onFiles,
}: DropzoneProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list).filter(
        (f) => f.size <= maxSizeMb * 1024 * 1024,
      );
      if (files.length > 0) onFiles(files);
    },
    [maxSizeMb, onFiles],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragging
          ? 'border-indigo-400 bg-indigo-500/10'
          : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500/60 hover:bg-slate-900'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 transition group-hover:scale-105">
        <UploadIcon size={26} />
      </div>
      <p className="text-base font-medium text-white">
        {multiple ? t.common.dropMultiple : t.common.drop}{' '}
        <span className="text-indigo-400 underline underline-offset-2">{t.common.upload}</span>
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {hint ?? `${t.upload.pdfOnly} · ${t.common.maxSize}: ${maxSizeMb} MB`}
      </p>
    </div>
  );
}
