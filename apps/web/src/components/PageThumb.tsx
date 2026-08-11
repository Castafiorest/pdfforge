import { useEffect, useState } from 'react';

import { renderPageThumbRobust } from '../lib/preview';
import type { Rotation } from '../lib/pdf';

type PageThumbProps = {
  file: File;
  pageNumber: number;
  rotation?: Rotation;
  className?: string;
};

export function PageThumb({ file, pageNumber, rotation = 0, className }: PageThumbProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    renderPageThumbRobust(file, pageNumber)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [file, pageNumber]);

  return (
    <div
      className={`relative aspect-[1/1.414] w-full overflow-hidden rounded-lg border border-slate-700 bg-white ${className ?? ''}`}
    >
      {src ? (
        <img
          src={src}
          alt={`Page ${pageNumber}`}
          className="h-full w-full object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : failed ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-semibold text-slate-500">
          {pageNumber}
        </div>
      ) : (
        <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-800" />
      )}
    </div>
  );
}
