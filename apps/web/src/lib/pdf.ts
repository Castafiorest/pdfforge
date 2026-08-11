import { PDFDocument, degrees, type PDFPage } from 'pdf-lib';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export function isSupportedImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type as ImageType);
}

async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

// ── Merge ───────────────────────────────────────────────────────────────
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  return out.save();
}

// ── Split ───────────────────────────────────────────────────────────────
export function parsePageRanges(spec: string, total: number): number[] {
  const result = new Set<number>();
  for (const part of spec.split(',')) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [a, b] = p.split('-').map((x) => parseInt(x, 10));
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      const from = Math.max(1, a);
      const to = Math.min(total, b);
      for (let i = from; i <= to; i += 1) result.add(i - 1);
    } else {
      const n = parseInt(p, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= total) result.add(n - 1);
    }
  }
  return [...result].sort((x, y) => x - y);
}

export type SplitMode = 'ranges' | 'every' | 'all';

export async function splitPdf(
  file: File,
  mode: SplitMode,
  ranges: string,
  every: number,
): Promise<{ bytes: Uint8Array; name: string }[]> {
  const src = await loadPdf(file);
  const total = src.getPageCount();

  let groups: number[][];
  if (mode === 'ranges') {
    const indices = parsePageRanges(ranges, total);
    if (indices.length === 0) throw new Error('no pages');
    groups = [indices];
  } else if (mode === 'every') {
    groups = [];
    for (let i = 0; i < total; i += Math.max(1, every)) {
      groups.push(Array.from({ length: Math.min(every, total - i) }, (_, k) => i + k));
    }
  } else {
    groups = Array.from({ length: total }, (_, i) => [i]);
  }

  const parts: { bytes: Uint8Array; name: string }[] = [];
  const base = file.name.replace(/\.pdf$/i, '');
  for (let g = 0; g < groups.length; g += 1) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, groups[g]);
    pages.forEach((page) => out.addPage(page));
    parts.push({
      bytes: await out.save(),
      name: groups.length > 1 ? `${base}-part-${g + 1}.pdf` : `${base}-extracted.pdf`,
    });
  }
  return parts;
}

// ── Organize ────────────────────────────────────────────────────────────
export type Rotation = 0 | 90 | 180 | 270;

export type PageItem = {
  key: string;
  sourceIndex: number;
  rotation: Rotation;
};

export async function organizePdf(file: File, items: PageItem[]): Promise<Uint8Array> {
  const src = await loadPdf(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  for (const item of items) {
    const page: PDFPage = pages[item.sourceIndex];
    page.setRotation(degrees(item.rotation));
    out.addPage(page);
  }
  return out.save();
}

// ── Image to PDF ────────────────────────────────────────────────────────
export type PageSizePreset = 'auto' | 'a4' | 'letter';
export type FitMode = 'contain' | 'cover' | 'stretch';

const PT = 72 / 25.4;
const A4 = { width: 210 * PT, height: 297 * PT };
const LETTER = { width: 215.9 * PT, height: 279.4 * PT };

async function imageToPngOrJpeg(file: File): Promise<{ bytes: Uint8Array; type: 'png' | 'jpeg' }> {
  if (file.type === 'image/png' || file.type === 'image/jpeg') {
    return { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type === 'image/png' ? 'png' : 'jpeg' };
  }
  // WebP (and anything else): draw to canvas, export as JPEG.
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.92),
  );
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: 'jpeg' };
}

export type ImageToPdfOptions = {
  pageSize: PageSizePreset;
  fit: FitMode;
  margin: number; // points
  orientation: 'auto' | 'portrait' | 'landscape';
};

export async function imagesToPdf(files: File[], opts: ImageToPdfOptions): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const margin = Math.max(0, opts.margin);

  for (const file of files) {
    const { bytes, type } = await imageToPngOrJpeg(file);
    const img = type === 'png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);

    let pageW: number;
    let pageH: number;
    if (opts.pageSize === 'a4') {
      pageW = A4.width;
      pageH = A4.height;
    } else if (opts.pageSize === 'letter') {
      pageW = LETTER.width;
      pageH = LETTER.height;
    } else {
      pageW = img.width;
      pageH = img.height;
    }
    if (opts.orientation === 'portrait' && pageW > pageH) [pageW, pageH] = [pageH, pageW];
    if (opts.orientation === 'landscape' && pageH > pageW) [pageW, pageH] = [pageH, pageW];

    const page = out.addPage([pageW, pageH]);
    const boxW = pageW - margin * 2;
    const boxH = pageH - margin * 2;
    if (boxW <= 0 || boxH <= 0) continue;

    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;

    let drawW: number;
    let drawH: number;
    if (opts.fit === 'stretch') {
      drawW = boxW;
      drawH = boxH;
    } else if (opts.fit === 'cover') {
      if (imgRatio > boxRatio) {
        drawH = boxH;
        drawW = drawH * imgRatio;
      } else {
        drawW = boxW;
        drawH = drawW / imgRatio;
      }
    } else {
      // contain
      if (imgRatio > boxRatio) {
        drawW = boxW;
        drawH = drawW / imgRatio;
      } else {
        drawH = boxH;
        drawW = drawH * imgRatio;
      }
    }

    const x = margin + (boxW - drawW) / 2;
    const y = margin + (boxH - drawH) / 2;
    page.drawImage(img, { x, y, width: drawW, height: drawH });
  }
  return out.save();
}
