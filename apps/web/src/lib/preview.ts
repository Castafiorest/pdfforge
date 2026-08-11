import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Render a single PDF page to a JPEG data URL for thumbnails.
 */
export async function renderPageThumb(
  file: File,
  pageNumber: number,
  targetWidth = 180,
): Promise<string> {
  const data = await file.arrayBuffer();
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
    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
    return canvas.toDataURL('image/jpeg', 0.7);
  } finally {
    await doc.destroy();
  }
}
