import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { fetchPagePreview } from '../api/client';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const RENDER_TIMEOUT_MS = 5_000;

/**
 * Render a single PDF page to a JPEG data URL for thumbnails.
 */
export async function renderPageThumb(
  file: File,
  pageNumber: number,
  targetWidth = 180,
): Promise<string> {
  // Pass a Uint8Array (not a raw ArrayBuffer) — pdf.js v4 can stall on page
  // operations when given an ArrayBuffer.
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  try {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaled = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    const renderTask = page.render({ canvasContext: ctx, viewport: scaled });
    // Never hang forever if rendering stalls (e.g. restricted webviews).
    await Promise.race([
      renderTask.promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('page render timed out')), RENDER_TIMEOUT_MS),
      ),
    ]);
    return canvas.toDataURL('image/jpeg', 0.7);
  } finally {
    await doc.destroy();
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('could not read preview'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Server-side fallback preview (rendered by the backend with PyMuPDF).
 * Used when client-side PDF.js rendering is unavailable or times out.
 */
export async function renderPageThumbServer(
  file: File,
  pageNumber: number,
  targetWidth = 180,
): Promise<string> {
  const blob = await fetchPagePreview(file, pageNumber, targetWidth);
  return blobToDataUrl(blob);
}

/**
 * Client-first preview with automatic server fallback.
 */
export async function renderPageThumbRobust(
  file: File,
  pageNumber: number,
  targetWidth = 180,
): Promise<string> {
  try {
    return await renderPageThumb(file, pageNumber, targetWidth);
  } catch {
    // Client render failed or timed out — fall back to the server renderer.
    return renderPageThumbServer(file, pageNumber, targetWidth);
  }
}
